
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request, params } = context;
  const url = new URL(request.url);
  
  // Robust ID extraction
  const rawId = params.id;
  const id = Array.isArray(rawId) ? String(rawId[0]) : (rawId ? String(rawId) : null);

  // GET: List or Single
  if (request.method === 'GET') {
    try {
      if (id) {
        const result = await env.DB.prepare(`
          SELECT c.*, v.name as venueName, v.region as region
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
          oneLineStory: result.one_line_story,
          zodiac: result.zodiac,
          viewsCount: result.views_count,
          likesCount: result.likes_count,
          postsCount: result.posts_count,
          isNew: result.is_new === 1
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const { results } = await env.DB.prepare(`
        SELECT c.*, v.name as venueName, v.region as region
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
        oneLineStory: c.one_line_story,
        zodiac: c.zodiac,
        viewsCount: c.views_count,
        likesCount: c.likes_count,
        postsCount: c.posts_count,
        isNew: c.is_new === 1
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
        birthday, address, phone, mbti, zodiac, oneLineStory, sns, experienceHistory, 
        maritalStatus, childrenStatus, specialNotes, password,
        image, venueId, languages, isNew
      } = body;

      // Force all values to primitives or null for D1 compatibility
      const paramsList = [
        name ? String(name) : null,
        nickname ? String(nickname) : null,
        realNameFirst ? String(realNameFirst) : null,
        realNameMiddle ? String(realNameMiddle) : null,
        realNameLast ? String(realNameLast) : null,
        birthday ? String(birthday) : null,
        address ? String(address) : null,
        phone ? String(phone) : null,
        mbti ? String(mbti) : null,
        zodiac ? String(zodiac) : null,
        oneLineStory ? String(oneLineStory) : null,
        sns ? JSON.stringify(sns) : null,
        experienceHistory ? JSON.stringify(experienceHistory) : null,
        maritalStatus ? String(maritalStatus) : null,
        childrenStatus ? String(childrenStatus) : null,
        specialNotes ? String(specialNotes) : null,
        image ? String(image) : null,
        venueId ? String(venueId) : null,
        password ? String(password) : null,
        languages ? JSON.stringify(languages) : null,
        isNew ? 1 : 0,
        String(id) // The ID for WHERE clause
      ];

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
          zodiac = COALESCE(?, zodiac),
          one_line_story = COALESCE(?, one_line_story),
          sns_links = COALESCE(?, sns_links),
          experience_history = COALESCE(?, experience_history),
          marital_status = COALESCE(?, marital_status),
          children_status = COALESCE(?, children_status),
          special_notes = COALESCE(?, special_notes),
          image = COALESCE(?, image),
          venue_id = COALESCE(?, venue_id),
          password = COALESCE(?, password),
          languages = COALESCE(?, languages),
          is_new = COALESCE(?, is_new)
        WHERE id = ?
      `).bind(...paramsList).run();

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
