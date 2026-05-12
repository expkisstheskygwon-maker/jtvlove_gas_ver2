// functions/api/secret/block.ts
import { Env, ensureSecretTables, JSON_HEADERS, makeId } from './_shared';

export const onRequest: any = async (context: any) => {
  const { env, request } = context as { env: Env; request: Request };

  try {
    await ensureSecretTables(env);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'DB init failed' }), { status: 500, headers: JSON_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { ccaId, fanId, action } = body || {};
    if (!ccaId || !fanId) return new Response(JSON.stringify({ error: 'ccaId and fanId are required' }), { status: 400, headers: JSON_HEADERS });

    const act = action === 'unblock' ? 'unblock' : 'block';

    if (act === 'unblock') {
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM secret_blocks WHERE cca_id = ? AND fan_id = ?`).bind(ccaId, fanId),
        env.DB.prepare(`UPDATE secret_conversations SET status = 'active' WHERE cca_id = ? AND fan_id = ?`).bind(ccaId, fanId),
      ]);
      return new Response(JSON.stringify({ success: true, blocked: false }), { headers: JSON_HEADERS });
    }

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO secret_blocks (id, cca_id, fan_id, status)
        VALUES (?, ?, ?, 'blocked')
        ON CONFLICT(cca_id, fan_id) DO UPDATE SET status = 'blocked'
      `).bind(makeId('sb'), ccaId, fanId),
      env.DB.prepare(`UPDATE secret_conversations SET status = 'blocked' WHERE cca_id = ? AND fan_id = ?`).bind(ccaId, fanId),
    ]);

    return new Response(JSON.stringify({ success: true, blocked: true }), { headers: JSON_HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Failed to update block' }), { status: 500, headers: JSON_HEADERS });
  }
};

