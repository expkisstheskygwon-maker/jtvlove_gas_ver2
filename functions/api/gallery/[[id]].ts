
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

  const headers = { 'Content-Type': 'application/json' };

  // GET: List all, by CCA, or FEED mode
  if (request.method === 'GET') {
    try {
      const ccaId = url.searchParams.get('ccaId');
      const feedMode = url.searchParams.get('feed');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
      const offset = (page - 1) * limit;

      const userId = url.searchParams.get('userId') || '';

      // ─── FEED MODE: All CCAs' gallery with Popularity & Follows ───
      if (feedMode === 'true') {
        const query = `
          WITH RankedPosts AS (
            SELECT
              g.id, g.type, g.url, g.caption,
              COALESCE(g.likes, 0) as likes,
              COALESCE(g.shares, 0) as shares,
              COALESCE(g.comments_count, 0) as comments_count,
              g.created_at,
              g.cca_id,
              c.name as cca_name,
              c.nickname as cca_nickname,
              c.image as cca_image,
              c.grade as cca_grade,
              c.score as cca_score,
              c.subscription_cost as cca_subscription_cost,
              v.name as venue_name,
              v.region as venue_region,
              (CASE WHEN (SELECT 1 FROM user_follows uf WHERE uf.follower_id = ? AND uf.following_id = c.id LIMIT 1) IS NOT NULL THEN 1 ELSE 0 END) as is_followed,
              (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as followers_count,
              ROW_NUMBER() OVER(PARTITION BY g.cca_id ORDER BY g.created_at DESC) as cca_post_rank
            FROM gallery g
            JOIN ccas c ON g.cca_id = c.id
            LEFT JOIN venues v ON c.venue_id = v.id
            WHERE c.status = 'active'
          )
          SELECT 
            *,
            (
              (
                (likes * 2.0 + comments_count * 3.0 + 1.0) 
                + (COALESCE(cca_score, 0) * 0.05)
              ) 
              * (CASE WHEN is_followed = 1 THEN 1.5 ELSE 1.0 END)
            ) 
            / (MAX(0, (julianday('now') - julianday(created_at)) * 24) + 2.0)
            * (
              CASE 
                WHEN cca_post_rank = 1 THEN 1.0
                WHEN cca_post_rank = 2 THEN 0.5
                WHEN cca_post_rank = 3 THEN 0.25
                ELSE 0.1
              END
            ) as final_rank_score
          FROM RankedPosts
          ORDER BY final_rank_score DESC, created_at DESC
          LIMIT ? OFFSET ?
        `;

        let results = [];
        let totalCount = 0;

        try {
          // Attempt the main query including the new cca_follows table
          const res = await env.DB.prepare(query).bind(userId, limit, offset).all();
          results = res.results;
          
          const countResult = await env.DB.prepare(
            `SELECT COUNT(*) as total FROM gallery g JOIN ccas c ON g.cca_id = c.id WHERE c.status = 'active'`
          ).first();
          totalCount = countResult?.total || 0;
        } catch (dbError: any) {
          console.warn('DB Error (likely missing cca_follows table), running fallback query...', dbError);
          // FALLBACK: Run the original query without cca_follows if the new table isn't migrated yet
          const fallbackQuery = `
            WITH RankedPosts AS (
              SELECT
                g.id, g.type, g.url, g.caption,
                COALESCE(g.likes, 0) as likes,
                COALESCE(g.shares, 0) as shares,
                COALESCE(g.comments_count, 0) as comments_count,
                g.created_at,
                g.cca_id,
                c.name as cca_name,
                c.nickname as cca_nickname,
                c.image as cca_image,
                c.grade as cca_grade,
                c.score as cca_score,
                c.subscription_cost as cca_subscription_cost,
                v.name as venue_name,
                v.region as venue_region,
                0 as is_followed,
                (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as followers_count,
                ROW_NUMBER() OVER(PARTITION BY g.cca_id ORDER BY g.created_at DESC) as cca_post_rank
              FROM gallery g
              JOIN ccas c ON g.cca_id = c.id
              LEFT JOIN venues v ON c.venue_id = v.id
              WHERE c.status = 'active'
            )
            SELECT 
              *,
              (
                (
                  (likes * 2.0 + comments_count * 3.0 + 1.0) 
                  + (COALESCE(cca_score, 0) * 0.05)
                ) * 1.0
              ) 
              / (MAX(0, (julianday('now') - julianday(created_at)) * 24) + 2.0)
              * (
                CASE 
                  WHEN cca_post_rank = 1 THEN 1.0
                  WHEN cca_post_rank = 2 THEN 0.1
                  WHEN cca_post_rank = 3 THEN 0.05
                  ELSE 0.01
                END
              ) as final_rank_score
            FROM RankedPosts
            ORDER BY final_rank_score DESC, created_at DESC
            LIMIT ? OFFSET ?
          `;
          const res = await env.DB.prepare(fallbackQuery).bind(limit, offset).all();
          results = res.results;
          
          const countResult = await env.DB.prepare(
            `SELECT COUNT(*) as total FROM gallery g JOIN ccas c ON g.cca_id = c.id WHERE c.status = 'active'`
          ).first();
          totalCount = countResult?.total || 0;
        }

        return new Response(JSON.stringify({
          items: results.map((item: any) => ({
            id: item.id,
            type: item.type,
            url: item.url,
            caption: item.caption,
            likes: item.likes || 0,
            shares: item.shares || 0,
            commentsCount: item.comments_count || 0,
            date: item.created_at,
            ccaId: item.cca_id,
            ccaName: item.cca_name,
            ccaNickname: item.cca_nickname,
            ccaImage: item.cca_image,
            ccaGrade: item.cca_grade,
            ccaScore: item.cca_score,
            subscriptionCost: item.cca_subscription_cost || 0,
            venueName: item.venue_name,
            venueRegion: item.venue_region,
            followersCount: item.followers_count || 0
          })),
          page,
          limit,
          total: totalCount,
          hasMore: offset + limit < totalCount
        }), { headers });
      }

      // ─── SINGLE ITEM by ID ───
      if (id && !ccaId) {
        const item = await env.DB.prepare(`
          SELECT 
            g.*, 
            c.name as cca_name, c.nickname as cca_nickname, 
            c.image as cca_image, c.grade as cca_grade,
            v.name as venue_name
          FROM gallery g
          JOIN ccas c ON g.cca_id = c.id
          LEFT JOIN venues v ON c.venue_id = v.id
          WHERE g.id = ?
        `).bind(id).first();

        if (!item) {
          return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
        }

        return new Response(JSON.stringify({
          id: item.id,
          type: item.type,
          url: item.url,
          caption: item.caption,
          likes: item.likes || 0,
          shares: item.shares || 0,
          commentsCount: item.comments_count || 0,
          date: item.created_at,
          ccaId: item.cca_id,
          ccaName: item.cca_name,
          ccaNickname: item.cca_nickname,
          ccaImage: item.cca_image,
          ccaGrade: item.cca_grade,
          venueName: item.venue_name
        }), { headers });
      }

      // ─── LIST by CCA (existing) ───
      let query = "SELECT * FROM gallery";
      let bindings: any[] = [];
      
      if (ccaId) {
        query = `
          SELECT g.* FROM gallery g
          JOIN ccas c ON g.cca_id = c.id
          WHERE c.id = ? OR c.nickname = ?
        `;
        bindings.push(ccaId, ccaId);
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
      }))), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
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
      
      return new Response(JSON.stringify({ id: newId, success: true }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
  }

  // DELETE
  if (request.method === 'DELETE' && id) {
    try {
      await env.DB.prepare("DELETE FROM gallery WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
