// functions/api/secret/conversations.ts
import { detectRole, ensureSecretTables, Env, JSON_HEADERS } from './_shared';

export const onRequest: any = async (context: any) => {
  const { env, request } = context as { env: Env; request: Request };
  const url = new URL(request.url);

  try {
    await ensureSecretTables(env);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'DB init failed' }), { status: 500, headers: JSON_HEADERS });
  }

  if (request.method === 'GET') {
    const userId = url.searchParams.get('userId');
    const roleParam = url.searchParams.get('role') as ('user' | 'cca' | null);
    if (!userId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: JSON_HEADERS });

    const role = roleParam || await detectRole(env, userId);

    try {
      if (role === 'user') {
        const { results } = await env.DB.prepare(`
          SELECT
            c.id AS conversationId,
            c.fan_id AS fanId,
            c.cca_id AS ccaId,
            COALESCE(cc.nickname, cc.name) AS ccaName,
            cc.image AS ccaImage,
            COALESCE(cc.paid_message_cost, 0) AS paidMessageCost,
            (
              SELECT m.content
              FROM secret_messages m
              WHERE m.conversation_id = c.id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS lastMessage,
            COALESCE(c.last_message_at, c.created_at) AS lastAt,
            (
              SELECT COUNT(*)
              FROM secret_messages m
              WHERE m.conversation_id = c.id
                AND m.sender_role != 'user'
                AND m.read_at IS NULL
            ) AS unreadCount,
            CASE WHEN EXISTS (
              SELECT 1 FROM secret_blocks b
              WHERE b.cca_id = c.cca_id AND b.fan_id = c.fan_id AND b.status = 'blocked'
            ) THEN 1 ELSE 0 END AS isBlocked,
            CASE WHEN EXISTS (
              SELECT 1 FROM user_subscriptions s
              WHERE s.subscriber_id = c.fan_id
                AND s.target_id = c.cca_id
                AND s.status = 'active'
                AND (s.expires_at IS NULL OR s.expires_at > datetime('now'))
            ) THEN 1 ELSE 0 END AS isSubscribed
          FROM secret_conversations c
          LEFT JOIN ccas cc ON cc.id = c.cca_id
          WHERE c.fan_id = ?
          ORDER BY lastAt DESC
        `).bind(userId).all();

        return new Response(JSON.stringify({ role, conversations: results || [] }), { headers: JSON_HEADERS });
      }

      // role === 'cca'
      const { results } = await env.DB.prepare(`
        SELECT
          c.id AS conversationId,
          c.fan_id AS fanId,
          u.nickname AS fanName,
          u.profile_image AS fanProfileImage,
          c.cca_id AS ccaId,
          COALESCE(cc.nickname, cc.name) AS ccaName,
          cc.image AS ccaImage,
          (
            SELECT m.content
            FROM secret_messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) AS lastMessage,
          COALESCE(c.last_message_at, c.created_at) AS lastAt,
          (
            SELECT COUNT(*)
            FROM secret_messages m
            WHERE m.conversation_id = c.id
              AND m.sender_role != 'cca'
              AND m.read_at IS NULL
          ) AS unreadCount,
          CASE WHEN EXISTS (
            SELECT 1 FROM secret_blocks b
            WHERE b.cca_id = c.cca_id AND b.fan_id = c.fan_id AND b.status = 'blocked'
          ) THEN 1 ELSE 0 END AS isBlocked
        FROM secret_conversations c
        LEFT JOIN users u ON u.id = c.fan_id
        LEFT JOIN ccas cc ON cc.id = c.cca_id
        WHERE c.cca_id = ?
        ORDER BY lastAt DESC
      `).bind(userId).all();

      return new Response(JSON.stringify({ role, conversations: results || [] }), { headers: JSON_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || 'Failed to load conversations' }), { status: 500, headers: JSON_HEADERS });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { fanId, ccaId } = body || {};
      if (!fanId || !ccaId) return new Response(JSON.stringify({ error: 'fanId and ccaId are required' }), { status: 400, headers: JSON_HEADERS });

      // create if not exists
      const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await env.DB.prepare(`
        INSERT INTO secret_conversations (id, fan_id, cca_id, status)
        VALUES (?, ?, ?, 'active')
        ON CONFLICT(fan_id, cca_id) DO NOTHING
      `).bind(id, fanId, ccaId).run();

      const conv = await env.DB.prepare(`SELECT id FROM secret_conversations WHERE fan_id = ? AND cca_id = ?`).bind(fanId, ccaId).first();
      if (!conv?.id) return new Response(JSON.stringify({ error: 'Failed to create conversation' }), { status: 500, headers: JSON_HEADERS });

      return new Response(JSON.stringify({ success: true, conversationId: conv.id }), { headers: JSON_HEADERS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message || 'Failed to create conversation' }), { status: 500, headers: JSON_HEADERS });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

