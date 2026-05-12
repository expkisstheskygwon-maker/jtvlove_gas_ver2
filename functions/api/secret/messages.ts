// functions/api/secret/messages.ts
import { DEFAULT_PAID_MESSAGE_COST, Env, ensureSecretTables, JSON_HEADERS, makeId } from './_shared';

export const onRequest: any = async (context: any) => {
  const { env, request } = context as { env: Env; request: Request };
  const url = new URL(request.url);

  try {
    await ensureSecretTables(env);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'DB init failed' }), { status: 500, headers: JSON_HEADERS });
  }

  // GET: 메시지 목록
  if (request.method === 'GET') {
    const conversationId = url.searchParams.get('conversationId');
    const limit = parseInt(url.searchParams.get('limit') || '80', 10);
    const markRead = url.searchParams.get('markRead') === '1';
    const viewerRole = (url.searchParams.get('viewerRole') || '') as ('user' | 'cca');

    if (!conversationId) return new Response(JSON.stringify({ error: 'conversationId required' }), { status: 400, headers: JSON_HEADERS });

    try {
      const { results } = await env.DB.prepare(`
        SELECT *
        FROM secret_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ?
      `).bind(conversationId, limit).all();

      if (markRead && (viewerRole === 'user' || viewerRole === 'cca')) {
        await env.DB.prepare(`
          UPDATE secret_messages
          SET read_at = CURRENT_TIMESTAMP
          WHERE conversation_id = ?
            AND sender_role != ?
            AND read_at IS NULL
        `).bind(conversationId, viewerRole).run();
      }

      return new Response(JSON.stringify({ messages: results || [] }), { headers: JSON_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || 'Failed to load messages' }), { status: 500, headers: JSON_HEADERS });
    }
  }

  // POST: 메시지 전송 (구독 체크 + 유료 차감 + CCA 수익 적립)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        conversationId: givenConversationId,
        fanId,
        ccaId,
        senderRole, // 'user' | 'cca'
        senderId,
        content,
        isPaid,
        pricePoints
      } = body || {};

      if (!fanId || !ccaId || !senderRole || !senderId || !content?.trim()) {
        return new Response(JSON.stringify({ error: 'fanId, ccaId, senderRole, senderId, content are required' }), { status: 400, headers: JSON_HEADERS });
      }
      if (senderRole !== 'user' && senderRole !== 'cca') {
        return new Response(JSON.stringify({ error: "senderRole must be 'user' or 'cca'" }), { status: 400, headers: JSON_HEADERS });
      }

      // 차단 체크
      const blocked = await env.DB.prepare(
        `SELECT 1 FROM secret_blocks WHERE cca_id = ? AND fan_id = ? AND status = 'blocked'`
      ).bind(ccaId, fanId).first();
      if (blocked) {
        return new Response(JSON.stringify({ error: '차단된 사용자입니다.', code: 'BLOCKED' }), { status: 403, headers: JSON_HEADERS });
      }

      // 구독 체크 (팬 -> CCA 전송에만 적용)
      if (senderRole === 'user') {
        const sub = await env.DB.prepare(`
          SELECT 1
          FROM user_subscriptions
          WHERE subscriber_id = ?
            AND target_id = ?
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > datetime('now'))
        `).bind(fanId, ccaId).first();
        if (!sub) {
          return new Response(JSON.stringify({ error: '구독자 전용 기능입니다.', code: 'NOT_SUBSCRIBED' }), { status: 403, headers: JSON_HEADERS });
        }
      }

      // 대화방 확보
      let conversationId = givenConversationId as string | undefined;
      if (!conversationId) {
        const existing = await env.DB.prepare(`SELECT id FROM secret_conversations WHERE fan_id = ? AND cca_id = ?`).bind(fanId, ccaId).first();
        if (existing?.id) {
          conversationId = existing.id;
        } else {
          const newConvId = makeId('sc');
          await env.DB.prepare(`INSERT INTO secret_conversations (id, fan_id, cca_id, status) VALUES (?, ?, ?, 'active')`)
            .bind(newConvId, fanId, ccaId).run();
          conversationId = newConvId;
        }
      }

      const messageId = makeId('sm');
      const paid = senderRole === 'user' && !!isPaid;

      let charged = 0;
      let remainingPoints: number | null = null;

      if (paid) {
        // 가격 결정: request > CCA 설정 > 기본값
        let cost = Number(pricePoints || 0);
        if (!cost || cost <= 0) {
          const cca = await env.DB.prepare(`SELECT paid_message_cost FROM ccas WHERE id = ?`).bind(ccaId).first();
          cost = Number(cca?.paid_message_cost || 0) || DEFAULT_PAID_MESSAGE_COST;
        }

        // 포인트 확인
        const user = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(fanId).first();
        const currentPoints = Number(user?.points || 0);
        if (currentPoints < cost) {
          return new Response(JSON.stringify({
            error: '포인트가 부족합니다.',
            code: 'INSUFFICIENT_POINTS',
            required: cost,
            current: currentPoints
          }), { status: 400, headers: JSON_HEADERS });
        }

        charged = cost;
        remainingPoints = currentPoints - cost;

        await env.DB.batch([
          env.DB.prepare(`
            INSERT INTO secret_messages (id, conversation_id, sender_role, sender_id, content, is_paid, price_points)
            VALUES (?, ?, ?, ?, ?, 1, ?)
          `).bind(messageId, conversationId, senderRole, senderId, content.trim(), cost),
          env.DB.prepare(`
            UPDATE secret_conversations
            SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(conversationId),
          env.DB.prepare(`UPDATE users SET points = points - ? WHERE id = ?`).bind(cost, fanId),
          env.DB.prepare(`
            INSERT INTO user_point_logs (id, user_id, amount, type, description)
            VALUES (?, ?, ?, 'use', ?)
          `).bind(makeId('upl'), fanId, -cost, `유료 비밀대화: ${ccaId}`),
          env.DB.prepare(`
            INSERT INTO cca_earning_logs (id, cca_id, amount_points, source_message_id, status)
            VALUES (?, ?, ?, ?, 'pending')
          `).bind(makeId('cel'), ccaId, cost, messageId),
        ]);
      } else {
        // 무료 메시지 (CCA가 보내는 메시지도 여기로)
        await env.DB.batch([
          env.DB.prepare(`
            INSERT INTO secret_messages (id, conversation_id, sender_role, sender_id, content, is_paid, price_points)
            VALUES (?, ?, ?, ?, ?, 0, 0)
          `).bind(messageId, conversationId, senderRole, senderId, content.trim()),
          env.DB.prepare(`
            UPDATE secret_conversations
            SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(conversationId),
        ]);
      }

      return new Response(JSON.stringify({
        success: true,
        messageId,
        conversationId,
        charged,
        remainingPoints
      }), { headers: JSON_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || 'Failed to send message' }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

