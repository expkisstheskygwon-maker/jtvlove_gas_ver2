
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
        id: bodyId, name, nickname, realNameFirst, realNameMiddle, realNameLast,
        birthday, address, phone, mbti, zodiac, oneLineStory, sns, experienceHistory,
        maritalStatus, childrenStatus, specialNotes, password,
        image, venueId, languages, isNew, weight, drinking, smoking, pets, specialties,
        status, grade
      } = body;

      const targetId = id || bodyId || `cca_${Date.now()}`;

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
          nickname || name || '',
          nickname || '',
          realNameFirst || '',
          realNameMiddle || '',
          realNameLast || '',
          birthday || '',
          address || '',
          phone || '',
          venueId || 'v1',
          image || '',
          status || 'active',
          grade || 'PRO',
          password || '1234',
          maritalStatus || 'SINGLE',
          childrenStatus || 'NONE',
          specialNotes || '',
          JSON.stringify(experienceHistory || []),
          JSON.stringify(languages || []),
          JSON.stringify(specialties || []),
          mbti || '',
          zodiac || '',
          oneLineStory || '',
          JSON.stringify(sns || {}),
          isNew ? 1 : 0,
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
          name ? String(name) : (nickname ? String(nickname) : null),
          nickname ? String(nickname) : null,
          realNameFirst !== undefined ? String(realNameFirst) : null,
          realNameMiddle !== undefined ? String(realNameMiddle) : null,
          realNameLast !== undefined ? String(realNameLast) : null,
          birthday !== undefined ? String(birthday) : null,
          address !== undefined ? String(address) : null,
          phone !== undefined ? String(phone) : null,
          mbti !== undefined ? String(mbti) : null,
          zodiac !== undefined ? String(zodiac) : null,
          oneLineStory !== undefined ? String(oneLineStory) : null,
          sns !== undefined ? JSON.stringify(sns) : null,
          experienceHistory !== undefined ? JSON.stringify(experienceHistory) : null,
          maritalStatus !== undefined ? String(maritalStatus) : null,
          childrenStatus !== undefined ? String(childrenStatus) : null,
          specialNotes !== undefined ? String(specialNotes) : null,
          image !== undefined ? String(image) : null,
          venueId !== undefined ? String(venueId) : null,
          password !== undefined ? String(password) : null,
          languages !== undefined ? JSON.stringify(languages) : null,
          isNew !== undefined ? (isNew ? 1 : 0) : null,
          weight !== undefined ? String(weight) : null,
          drinking !== undefined ? String(drinking) : null,
          smoking !== undefined ? String(smoking) : null,
          pets !== undefined ? String(pets) : null,
          specialties !== undefined ? JSON.stringify(specialties) : null,
          status !== undefined ? String(status) : null,
          grade !== undefined ? String(grade) : null,
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
