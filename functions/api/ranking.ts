
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

      // Calculate date 7 days ago in SQLite format
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');

      // Simplified ranking query without CTEs for better compatibility
      const query = `
        SELECT
          c.id,
          c.name,
          c.nickname,
          c.image,
          c.score as base_score,
          COALESCE(c.is_working, 0) as is_working,
          COALESCE(c.score, 0) * 0.4 +
            COALESCE((SELECT COUNT(*) FROM gallery g WHERE g.cca_id = c.id AND g.created_at >= ?), 0) * 0.35 +
            COALESCE((SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id AND uf.created_at >= ?), 0) * 0.25
          as ranking_score,
          (SELECT COUNT(*) FROM gallery_likes gl JOIN gallery g ON gl.gallery_id = g.id WHERE g.cca_id = c.id AND gl.created_at >= ?) as recent_likes,
          (SELECT COUNT(*) FROM gallery_comments gc JOIN gallery g ON gc.gallery_id = g.id WHERE g.cca_id = c.id AND gc.created_at >= ?) as recent_comments,
          (SELECT SUM(g.views) FROM gallery g WHERE g.cca_id = c.id AND g.created_at >= ?) as recent_views,
          (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id AND uf.created_at >= ?) as new_followers_7d,
          (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as total_followers
        FROM ccas c
        WHERE c.status = 'active'
        ORDER BY ranking_score DESC
        LIMIT ?
      `;

      const { results } = await env.DB.prepare(query)
        .bind(sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, limit)
        .all();

      const rankedCCAs = results.map((r: any, index: number) => ({
        rank: index + 1,
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        image: r.image,
        baseScore: r.base_score || 0,
        recentLikes: r.recent_likes || 0,
        recentComments: r.recent_comments || 0,
        recentViews: r.recent_views || 0,
        newFollowers7d: r.new_followers_7d || 0,
        totalFollowers: r.total_followers || 0,
        isWorking: r.is_working === 1,
        rankingScore: r.ranking_score || 0
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
        error: error.message
      }), {
        status: 500,
        headers
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
