
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
      const limit = parseInt(url.searchParams.get('limit') || '5');

      // Simple query to get active CCAs with basic stats
      const query = `
        SELECT
          c.id,
          c.name,
          c.nickname,
          c.image,
          c.score,
          COALESCE(c.is_working, 0) as is_working,
          (SELECT COUNT(*) FROM gallery g WHERE g.cca_id = c.id) as post_count,
          (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as total_followers
        FROM ccas c
        WHERE c.status = 'active'
        ORDER BY c.score DESC
        LIMIT ?
      `;

      const { results } = await env.DB.prepare(query)
        .bind(limit)
        .all();

      console.log('Ranking query results:', results);

      const rankedCCAs = results.map((r: any, index: number) => ({
        rank: index + 1,
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        image: r.image,
        baseScore: r.score || 0,
        recentLikes: 0,
        recentComments: 0,
        recentViews: 0,
        newFollowers7d: 0,
        totalFollowers: r.total_followers || 0,
        isWorking: r.is_working === 1,
        rankingScore: r.score || 0
      }));

      return new Response(JSON.stringify({
        success: true,
        rankings: rankedCCAs,
        lastUpdated: new Date().toISOString()
      }), { headers });
    } catch (error: any) {
      console.error('Ranking API error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }), {
        status: 500,
        headers
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
