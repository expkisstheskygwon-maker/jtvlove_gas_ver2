
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
      const venueIdParam = url.searchParams.get('venueId');

      let query = `
        SELECT c.*, v.name as venueName, v.region as region
        FROM ccas c 
        LEFT JOIN venues v ON c.venue_id = v.id
      `;
      let queryParams: any[] = [];

      if (id) {
        query += " WHERE c.id = ?";
        queryParams.push(id);
        const result = await env.DB.prepare(query).bind(...queryParams).first();

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
          weight: result.weight,
          drinking: result.drinking,
          smoking: result.smoking,
          pets: result.pets,
          specialties: result.specialties ? JSON.parse(result.specialties) : [],
          viewsCount: result.views_count,
          likesCount: result.likes_count,
          postsCount: result.posts_count,
          isNew: result.is_new === 1
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (venueIdParam) {
        query += " WHERE c.venue_id = ?";
        queryParams.push(venueIdParam);
      }

      const { results } = await env.DB.prepare(query).bind(...queryParams).all();

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
        weight: c.weight,
        drinking: c.drinking,
        smoking: c.smoking,
        pets: c.pets,
        specialties: c.specialties ? JSON.parse(c.specialties) : [],
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

  // POST: Create or Update
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        id: bodyId, name, nickname,
        realNameFirst, real_name_first,
        realNameMiddle, real_name_middle,
        realNameLast, real_name_last,
        birthday, address, phone, mbti, zodiac,
        oneLineStory, one_line_story,
        sns, sns_links,
        experienceHistory, experience_history,
        maritalStatus, marital_status,
        childrenStatus, children_status,
        specialNotes, special_notes,
        password,
        image,
        venueId, venue_id,
        languages, isNew, is_new, weight, drinking, smoking, pets, specialties,
        status, grade
      } = body;

      const targetId = id || bodyId || `cca_${Date.now()}`;

      // Fallback logic
      const f_realNameFirst = realNameFirst || real_name_first || '';
      const f_realNameMiddle = realNameMiddle || real_name_middle || '';
      const f_realNameLast = realNameLast || real_name_last || '';
      const f_oneLineStory = oneLineStory || one_line_story || '';
      const f_sns = sns || sns_links || {};
      const f_experienceHistory = experienceHistory || experience_history || [];
      const f_maritalStatus = maritalStatus || marital_status || 'SINGLE';
      const f_childrenStatus = childrenStatus || children_status || 'NONE';
      const f_specialNotes = specialNotes || special_notes || '';
      const f_venueId = venueId || venue_id || 'v1';
      const f_isNew = (isNew !== undefined ? isNew : (is_new !== undefined ? is_new : false));
      const f_languages = languages || [];
      const f_specialties = specialties || [];
      const f_name = nickname || name || '';

      if (!id && !bodyId) {
        // CREATE
        await env.DB.prepare(`
          INSERT INTO ccas (
            id, name, nickname, real_name_first, real_name_middle, real_name_last,
            birthday, address, phone, venue_id, image, status, grade,
            password, marital_status, children_status, special_notes,
            experience_history, languages, specialties,
            mbti, zodiac, one_line_story, sns_links,
            is_new, weight, drinking, smoking, pets
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          targetId,
          f_name,
          nickname || '',
          f_realNameFirst,
          f_realNameMiddle,
          f_realNameLast,
          birthday || '',
          address || '',
          phone || '',
          f_venueId,
          image || '',
          status || 'active',
          grade || 'PRO',
          password || '1234',
          f_maritalStatus,
          f_childrenStatus,
          f_specialNotes,
          JSON.stringify(f_experienceHistory),
          JSON.stringify(f_languages),
          JSON.stringify(f_specialties),
          mbti || '',
          zodiac || '',
          f_oneLineStory,
          JSON.stringify(f_sns),
          f_isNew ? 1 : 0,
          weight || '',
          drinking || '',
          smoking || '',
          pets || ''
        ).run();

        return new Response(JSON.stringify({ success: true, id: targetId }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // UPDATE
        const updateId = id || bodyId;
        const paramsList = [
          f_name || null,
          nickname || null,
          f_realNameFirst || null,
          f_realNameMiddle || null,
          f_realNameLast || null,
          birthday || null,
          address || null,
          phone || null,
          mbti || null,
          zodiac || null,
          f_oneLineStory || null,
          f_sns ? JSON.stringify(f_sns) : null,
          f_experienceHistory ? JSON.stringify(f_experienceHistory) : null,
          f_maritalStatus || null,
          f_childrenStatus || null,
          f_specialNotes || null,
          image || null,
          f_venueId || null,
          password || null,
          f_languages ? JSON.stringify(f_languages) : null,
          f_isNew !== undefined ? (f_isNew ? 1 : 0) : null,
          weight || null,
          drinking || null,
          smoking || null,
          pets || null,
          f_specialties ? JSON.stringify(f_specialties) : null,
          status || null,
          grade || null,
          String(updateId)
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
            is_new = COALESCE(?, is_new),
            weight = COALESCE(?, weight),
            drinking = COALESCE(?, drinking),
            smoking = COALESCE(?, smoking),
            pets = COALESCE(?, pets),
            specialties = COALESCE(?, specialties),
            status = COALESCE(?, status),
            grade = COALESCE(?, grade)
          WHERE id = ?
        `).bind(...paramsList).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE: CCA 삭제
  if (request.method === 'DELETE') {
    try {
      if (!id) {
        return new Response(JSON.stringify({ error: "CCA ID is required" }), { status: 400 });
      }

      // Manual cascade deletion to avoid foreign key constraints
      await env.DB.batch([
        env.DB.prepare("DELETE FROM gallery WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cca_holidays WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cca_sold_out WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cca_attendance WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM customer_messages WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM admin_messages WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cca_point_logs WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cca_employment_history WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM reservations WHERE cca_id = ?").bind(id),
        env.DB.prepare("DELETE FROM ccas WHERE id = ?").bind(id)
      ]);

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
