// Gallery Reports API — Handle reporting and listing of reported gallery items
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);

  const headers = { 'Content-Type': 'application/json' };

  // Ensure table exists on first request
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS gallery_reports (
        id TEXT PRIMARY KEY,
        gallery_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (dbErr: any) {
    console.error('Create table gallery_reports error:', dbErr);
  }

  // GET: List reports (For Super Admin panel)
  if (request.method === 'GET') {
    try {
      const query = `
        SELECT 
          r.id, r.gallery_id, r.reporter_id, r.reason, r.created_at,
          g.url as post_url, g.type as post_type, g.caption as post_caption,
          c.nickname as cca_nickname,
          u.nickname as reporter_nickname
        FROM gallery_reports r
        LEFT JOIN gallery g ON r.gallery_id = g.id
        LEFT JOIN ccas c ON g.cca_id = c.id
        LEFT JOIN users u ON r.reporter_id = u.id
        ORDER BY r.created_at DESC
      `;

      const { results } = await env.DB.prepare(query).all();

      return new Response(JSON.stringify(results), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // POST: Create report
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { galleryId, reporterId, reason } = body;

      if (!galleryId || !reporterId || !reason) {
        return new Response(JSON.stringify({ error: 'galleryId, reporterId, and reason are required' }), { status: 400, headers });
      }

      const newId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO gallery_reports (id, gallery_id, reporter_id, reason)
        VALUES (?, ?, ?, ?)
      `).bind(newId, galleryId, reporterId, reason).run();

      return new Response(JSON.stringify({ success: true, id: newId }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  // DELETE: Dismiss report (Super Admin action)
  if (request.method === 'DELETE') {
    try {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
      }

      await env.DB.prepare('DELETE FROM gallery_reports WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};
