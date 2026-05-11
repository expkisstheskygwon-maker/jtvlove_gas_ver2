
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
      
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Combined ranking query:
      // 1. Base score from cca_score (existing field)
      // 2. Recent activity (likes, comments from last 7 days)
      // 3. Follower growth rate (last 7 days follower increase)
      const query = `
        WITH recent_activity AS (
          SELECT 
            g.cca_id,
            COUNT(DISTINCT gl.id) as recent_likes,
            COUNT(DISTINCT gc.id) as recent_comments,
            SUM(g.views) as recent_views
          FROM gallery g
          LEFT JOIN gallery_likes gl ON g.id = gl.gallery_id AND gl.created_at >= ?
          LEFT JOIN gallery_comments gc ON g.id = gc.gallery_id AND gc.created_at >= ?
          WHERE g.created_at >= ?
          GROUP BY g.cca_id
        ),
        follower_growth AS (
          SELECT 
            uf.following_id as cca_id,
            COUNT(*) as follower_count
          FROM user_follows uf
          WHERE uf.created_at >= ?
          GROUP BY uf.following_id
        ),
        total_followers AS (
          SELECT 
            following_id as cca_id,
            COUNT(*) as total_followers
          FROM user_follows
          GROUP BY following_id
        )
        SELECT 
          c.id,
          c.name,
          c.nickname,
          c.image,
          c.score as base_score,
          COALESCE(ra.recent_likes, 0) as recent_likes,
          COALESCE(ra.recent_comments, 0) as recent_comments,
          COALESCE(ra.recent_views, 0) as recent_views,
          COALESCE(fg.follower_count, 0) as new_followers_7d,
          COALESCE(tf.total_followers, 0) as total_followers,
          c.is_working,
          (
            -- Base score weight: 40%
            (COALESCE(c.score, 0) * 0.4) +
            -- Recent activity weight: 35%
            (COALESCE(ra.recent_likes, 0) * 2.0 +
             COALESCE(ra.recent_comments, 0) * 3.0 +
             COALESCE(ra.recent_views, 0) * 0.1) * 0.35 +
            -- Follower growth rate weight: 25%
            (CASE 
              WHEN COALESCE(tf.total_followers, 0) > 0 
              THEN (COALESCE(fg.follower_count, 0) * 100.0 / COALESCE(tf.total_followers, 1))
              ELSE 0
            END) * 0.25
          ) as ranking_score
        FROM ccas c
        LEFT JOIN recent_activity ra ON c.id = ra.cca_id
        LEFT JOIN follower_growth fg ON c.id = fg.cca_id
        LEFT JOIN total_followers tf ON c.id = tf.cca_id
        WHERE c.status = 'active'
        ORDER BY ranking_score DESC
        LIMIT ?
      `;

      const { results } = await env.DB.prepare(query)
        .bind(sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, sevenDaysAgo, limit)
        .all();

      const rankedCCAs = results.map((r: any, index: number) => ({
        rank: index + 1,
        id: r.id,
        name: r.name,
        nickname: r.nickname,
        image: r.image,
        baseScore: r.base_score || 0,
        recentLikes: r.recent_likes,
        recentComments: r.recent_comments,
        recentViews: r.recent_views,
        newFollowers7d: r.new_followers_7d,
        totalFollowers: r.total_followers,
        isWorking: r.is_working === 1,
        rankingScore: r.ranking_score
      }));

      return new Response(JSON.stringify({
        success: true,
        rankings: rankedCCAs,
        lastUpdated: new Date().toISOString()
      }), { headers });
    } catch (error: any) {
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
