
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request, params } = context;
  const url = new URL(request.url);
  
  const rawId = params.id;
  const id = Array.isArray(rawId) ? String(rawId[0]) : (rawId ? String(rawId) : null);

  // GET: List all or by CCA
  if (request.method === 'GET') {
    try {
      const ccaId = url.searchParams.get('ccaId');
      
      let query = "SELECT * FROM gallery";
      let bindings: any[] = [];
      
      if (ccaId) {
        query += " WHERE cca_id = ?";
        bindings.push(ccaId);
      } else if (id) {
        query += " WHERE id = ?";
        bindings.push(id);
      }
      
      query += " ORDER BY created_at DESC";
      
      const { results } = await env.DB.prepare(query).bind(...bindings).all();
      
      return new Response(JSON.stringify(results.map((item: any) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        caption: item.caption,
        likes: item.likes,
        shares: item.shares,
        commentsCount: item.comments_count,
        date: item.created_at
      }))), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST: Create
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { ccaId, type, url, caption } = body;
      
      if (!ccaId || !type || !url) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }
      
      const newId = crypto.randomUUID();
      
      await env.DB.prepare(`
        INSERT INTO gallery (id, cca_id, type, url, caption)
        VALUES (?, ?, ?, ?, ?)
      `).bind(newId, ccaId, type, url, caption || null).run();
      
      return new Response(JSON.stringify({ id: newId, success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE
  if (request.method === 'DELETE' && id) {
    try {
      await env.DB.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
