
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);

  const headers = { 'Content-Type': 'application/json' };

  if (request.method === 'GET') {
    try {
      const limit = parseInt(url.searchParams.get('limit') || '10');

      // Simple query to get active CCAs ordered by creation date
      const query = `
        SELECT
          c.id,
          c.name,
          c.nickname,
          c.image,
          c.score,
          c.created_at,
          COALESCE(c.is_working, 0) as is_working,
          (SELECT COUNT(*) FROM gallery g WHERE g.cca_id = c.id) as post_count,
          (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as total_followers
        FROM ccas c
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT ?
      `;

      const { results } = await env.DB.prepare(query)
        .bind(limit)
        .all();

      console.log('New CCAs query results:', results);

      const newCCAs = results.map((r: any) => ({
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        image: r.image,
        score: r.score || 0,
        createdAt: r.created_at,
        isWorking: r.is_working === 1,
        postCount: r.post_count || 0,
        totalFollowers: r.total_followers || 0
      }));

      return new Response(JSON.stringify({
        success: true,
        ccas: newCCAs,
        lastUpdated: new Date().toISOString()
      }), { headers });
    } catch (error: any) {
      console.error('New CCAs API error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
