
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const venueIdParam = url.searchParams.get('venueId');

  const rawId = params.id;
  const id = Array.isArray(rawId) ? String(rawId[0]) : (rawId ? String(rawId) : null);

  const normalizeUrl = (u: string) => {
    if (u && u.startsWith('https://r2.jtvstar.com/')) {
      const key = u.replace('https://r2.jtvstar.com/', '');
      return `/api/r2?key=${encodeURIComponent(key)}`;
    }
    return u;
  };

  // GET: List all or single
  if (request.method === 'GET') {
    try {
      // Auto-migrate schema to prevent 500 error if columns don't exist yet
      try { await env.DB.prepare("ALTER TABLE ccas ADD COLUMN score INTEGER DEFAULT 50").run(); } catch(e) {}
      try { await env.DB.prepare("ALTER TABLE ccas ADD COLUMN score_updated_at TEXT").run(); } catch(e) {}
      try { await env.DB.prepare("ALTER TABLE ccas ADD COLUMN subscription_cost INTEGER DEFAULT 0").run(); } catch(e) {}
      try { await env.DB.prepare("ALTER TABLE ccas ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run(); } catch(e) {}

      const getBusinessDate = () => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();

        // 9:30 AM Local (UTC+9) = 00:30 AM UTC
        // 00:00 ~ 00:29 (UTC) == 09:00 ~ 09:29 (Local) -> Still yesterday's business day
        if (utcHours === 0 && utcMinutes < 30) {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return yesterday.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
      };

      const currentBusinessDate = getBusinessDate();

      let query = `
        SELECT c.*, v.name as venueName, v.name as venue_name, v.region as region,
               a.status as attendanceStatus, a.check_in_at as checkInAt, a.attendance_date,
               (SELECT COUNT(*) FROM user_follows uf WHERE uf.following_id = c.id) as followers_count
        FROM ccas c
        LEFT JOIN venues v ON c.venue_id = v.id
        LEFT JOIN (
           SELECT ca.* FROM cca_attendance ca
           INNER JOIN (
              SELECT cca_id, MAX(check_in_at) as max_check_in
              FROM cca_attendance
              WHERE status = 'checked_in'
              GROUP BY cca_id
           ) latest ON ca.cca_id = latest.cca_id AND ca.check_in_at = latest.max_check_in
        ) a ON c.id = a.cca_id
      `;
      let queryParams: any[] = [];

      if (id) {
        query += " WHERE c.id = ? OR c.nickname = ?";
        queryParams.push(id, id.startsWith('@') ? id.substring(1) : id);
        const result = await env.DB.prepare(query).bind(...queryParams).first();

        if (!result) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

        const isWorking = result.attendanceStatus === 'checked_in' && result.attendance_date === currentBusinessDate;

        return new Response(JSON.stringify({
          ...result,
          image: normalizeUrl(result.image),
          isWorking,
          attendanceStatus: result.attendanceStatus,
          checkInAt: result.checkInAt,
          followersCount: result.followers_count || 0,
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
          score: result.score,
          scoreUpdatedAt: result.score_updated_at,
          subscriptionCost: result.subscription_cost || 0,
          isNew: result.is_new === 1
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (venueIdParam) {
        query += " WHERE (c.venue_id = ? OR c.pending_venue_id = ?)";
        queryParams.push(venueIdParam, venueIdParam);
      }

      const orderSql = " ORDER BY c.score DESC NULLS LAST, c.created_at DESC";
      query += orderSql;

      let results;
      try {
        const res = await env.DB.prepare(query).bind(...queryParams).all();
        results = res.results;
      } catch (dbError: any) {
        console.error("Query failed with ORDER BY, trying without:", dbError);
        query = query.replace(orderSql, "");
        const fallbackRes = await env.DB.prepare(query).bind(...queryParams).all();
        results = fallbackRes.results;
      }

      return new Response(JSON.stringify(results.map((r: any) => ({
        ...r,
        image: normalizeUrl(r.image),
        isWorking: r.attendanceStatus === 'checked_in' && r.attendance_date === currentBusinessDate,
        languages: r.languages ? JSON.parse(r.languages) : [],
        venueId: r.venue_id,
        sns: r.sns_links ? JSON.parse(r.sns_links) : {},
        isNew: r.is_new === 1,
        score: r.score,
        scoreUpdatedAt: r.score_updated_at,
        subscriptionCost: r.subscription_cost || 0
      }))), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
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
        status, grade, media,
        subscriptionCost, subscription_cost
      } = body;

      const targetId = id || bodyId || `cca_${Date.now()}`;

      const f_realNameFirst = realNameFirst ?? real_name_first ?? null;
      const f_realNameMiddle = realNameMiddle ?? real_name_middle ?? null;
      const f_realNameLast = realNameLast ?? real_name_last ?? null;
      const f_oneLineStory = oneLineStory ?? one_line_story ?? null;
      const f_sns = sns ?? sns_links ?? null;
      const f_experienceHistory = experienceHistory ?? experience_history ?? null;
      const f_maritalStatus = maritalStatus ?? marital_status ?? null;
      const f_childrenStatus = childrenStatus ?? children_status ?? null;
      const f_specialNotes = specialNotes ?? special_notes ?? null;
      let f_venueId = venueId ?? venue_id ?? null; 
      const f_isNew = isNew ?? is_new ?? null;
      const f_languages = languages ?? null;
      const f_specialties = specialties ?? null;
      const f_name = nickname ?? name ?? null;
      const f_subscriptionCost = subscriptionCost ?? subscription_cost ?? 0;

      if (!id && !bodyId) {
        // CREATE
        await env.DB.prepare(`
          INSERT INTO ccas (
            id, name, nickname, real_name_first, real_name_middle, real_name_last,
            birthday, address, phone, venue_id, image, status, grade,
            password, marital_status, children_status, special_notes,
            experience_history, languages, specialties,
            mbti, zodiac, one_line_story, sns_links,
            is_new, weight, drinking, smoking, pets, subscription_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          f_venueId || 'v1',
          image || '',
          status || 'active',
          grade || 'PRO',
          password || '1234',
          f_maritalStatus || 'SINGLE',
          f_childrenStatus || 'NONE',
          f_specialNotes || '',
          JSON.stringify(f_experienceHistory || []),
          JSON.stringify(f_languages || []),
          JSON.stringify(f_specialties || []),
          mbti || '',
          zodiac || '',
          f_oneLineStory || '',
          JSON.stringify(f_sns || {}),
          f_isNew ? 1 : 0,
          weight || '',
          drinking || '',
          smoking || '',
          pets || '',
          f_subscriptionCost
        ).run();
      } else {
        // UPDATE
        const updateId = id || bodyId;
        await env.DB.prepare(`
          UPDATE ccas SET 
            name = ?, nickname = ?, real_name_first = ?, real_name_middle = ?, real_name_last = ?,
            birthday = ?, address = ?, phone = ?, mbti = ?, zodiac = ?,
            one_line_story = ?, sns_links = ?, experience_history = ?,
            marital_status = ?, children_status = ?, special_notes = ?,
            image = ?, venue_id = ?, languages = ?, is_new = ?,
            weight = ?, drinking = ?, smoking = ?, pets = ?, specialties = ?,
            status = ?, grade = ?, subscription_cost = ?
          WHERE id = ?
        `).bind(
          f_name, nickname || '', f_realNameFirst, f_realNameMiddle, f_realNameLast,
          birthday || '', address || '', phone || '', mbti || '', zodiac || '',
          f_oneLineStory || '', JSON.stringify(f_sns || {}), JSON.stringify(f_experienceHistory || []),
          f_maritalStatus || 'SINGLE', f_childrenStatus || 'NONE', f_specialNotes || '',
          image || '', f_venueId || 'v1', JSON.stringify(f_languages || []), f_isNew ? 1 : 0,
          weight || '', drinking || '', smoking || '', pets || '', JSON.stringify(f_specialties || []),
          status || 'active', grade || 'PRO', f_subscriptionCost,
          updateId
        ).run();

        // Sync to users table if image or nickname changed
        try {
          const userUpdates = [];
          const userValues = [];
          if (nickname !== undefined || f_name !== undefined) {
            userUpdates.push("nickname = ?");
            userValues.push(nickname || f_name);
          }
          if (image !== undefined) {
            userUpdates.push("profile_image = ?");
            userValues.push(image);
          }

          if (userUpdates.length > 0) {
            userValues.push(updateId);
            await env.DB.prepare(`UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`).bind(...userValues).run();
          }
        } catch (syncError) {
          // Ignore if user record doesn't exist
          console.error("Sync to users failed:", syncError);
        }
      }

      // Sync Neural Media (Gallery)
      if (Array.isArray(media)) {
        // Clear existing gallery for this CCA
        await env.DB.prepare("DELETE FROM gallery WHERE cca_id = ?").bind(targetId).run();
        
        // Insert new ones
        for (const item of media) {
          if (item.url) {
            await env.DB.prepare(`
              INSERT INTO gallery (id, cca_id, type, url, caption)
              VALUES (?, ?, ?, ?, ?)
            `).bind(`gal_${Date.now()}_${Math.random()}`, targetId, item.type || 'photo', item.url, item.caption || null).run();
          }
        }
      }

      return new Response(JSON.stringify({ success: true, id: targetId }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error('POST CCA error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // DELETE
  if (request.method === 'DELETE' && id) {
    try {
      await env.DB.prepare("DELETE FROM ccas WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
