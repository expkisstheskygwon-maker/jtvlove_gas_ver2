
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request, params } = context;
  const url = new URL(request.url);
  
  // In [[id]].ts, params.id will be an array if using [[...id]] or a string if using [[id]]
  // But for Cloudflare Pages, [[id]] means optional single segment.
  const id = params.id;

  // GET: List or Single
  if (request.method === 'GET') {
    try {
      if (id) {
        const result = await env.DB.prepare(`
          SELECT c.*, v.name as venueName 
          FROM ccas c 
          LEFT JOIN venues v ON c.venue_id = v.id
          WHERE c.id = ?
        `).bind(id).first();

        if (!result) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

        return new Response(JSON.stringify({
          ...result,
          languages: result.languages ? JSON.parse(result.languages) : [],
          venueId: result.venue_id,
          sns: result.sns_links ? JSON.parse(result.sns_links) : {},
          experienceHistory: result.experience_history ? JSON.parse(result.experience_history) : [],
          realNameFirst: result.real_name_first,
          realNameMiddle: result.real_name_middle,
          realNameLast: result.real_name_last,
          maritalStatus: result.marital_status,
          childrenStatus: result.children_status,
          specialNotes: result.special_notes,
          viewsCount: result.views_count,
          likesCount: result.likes_count,
          postsCount: result.posts_count
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const { results } = await env.DB.prepare(`
        SELECT c.*, v.name as venueName 
        FROM ccas c 
        LEFT JOIN venues v ON c.venue_id = v.id
      `).all();

      const formattedResults = results.map((c: any) => ({
        ...c,
        languages: c.languages ? JSON.parse(c.languages) : [],
        venueId: c.venue_id,
        sns: c.sns_links ? JSON.parse(c.sns_links) : {},
        experienceHistory: c.experience_history ? JSON.parse(c.experience_history) : [],
        realNameFirst: c.real_name_first,
        realNameMiddle: c.real_name_middle,
        realNameLast: c.real_name_last,
        maritalStatus: c.marital_status,
        childrenStatus: c.children_status,
        specialNotes: c.special_notes,
        viewsCount: c.views_count,
        likesCount: c.likes_count,
        postsCount: c.posts_count
      }));

      return new Response(JSON.stringify(formattedResults), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST: Update
  if (request.method === 'POST' && id) {
    try {
      const body = await request.json();
      const { 
        name, nickname, realNameFirst, realNameMiddle, realNameLast, 
        birthday, address, phone, mbti, sns, experienceHistory, 
        maritalStatus, childrenStatus, specialNotes, password,
        image, venueId
      } = body;

      // Update including the 'name' field
      await env.DB.prepare(`
        UPDATE ccas SET
          name = COALESCE(?, name),
          nickname = COALESCE(?, nickname),
          real_name_first = COALESCE(?, real_name_first),
          real_name_middle = COALESCE(?, real_name_middle),
          real_name_last = COALESCE(?, real_name_last),
          birthday = COALESCE(?, birthday),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          mbti = COALESCE(?, mbti),
          sns_links = COALESCE(?, sns_links),
          experience_history = COALESCE(?, experience_history),
          marital_status = COALESCE(?, marital_status),
          children_status = COALESCE(?, children_status),
          special_notes = COALESCE(?, special_notes),
          image = COALESCE(?, image),
          venue_id = COALESCE(?, venue_id),
          password = COALESCE(?, password)
        WHERE id = ?
      `).bind(
        name || null, nickname || null, realNameFirst || null, realNameMiddle || null, realNameLast || null,
        birthday || null, address || null, phone || null, mbti || null,
        sns ? JSON.stringify(sns) : null, experienceHistory ? JSON.stringify(experienceHistory) : null,
        maritalStatus || null, childrenStatus || null, specialNotes || null,
        image || null, venueId || null, password || null,
        id
      ).run();

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
