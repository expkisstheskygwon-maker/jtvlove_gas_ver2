
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

      const getBusinessDate = () => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        if (utcHours === 0 && utcMinutes < 30) {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return yesterday.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
      };

      const currentBusinessDate = getBusinessDate();

      let query = `
        SELECT c.*, v.name as venueName, v.name as venue_name, v.region as region,
               a.status as attendanceStatus, a.check_in_at as checkInAt, a.attendance_date
        FROM ccas c 
        LEFT JOIN venues v ON c.venue_id = v.id
        LEFT JOIN (
          SELECT * FROM cca_attendance 
          WHERE (cca_id, check_in_at) IN (
            SELECT cca_id, MAX(check_in_at) 
            FROM cca_attendance 
            GROUP BY cca_id
          )
        ) a ON c.id = a.cca_id
      `;
      let queryParams: any[] = [];

      if (id) {
        query += " WHERE c.id = ?";
        queryParams.push(id);
        const result = await env.DB.prepare(query).bind(...queryParams).first();

        if (!result) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

        const isWorking = result.attendanceStatus === 'checked_in' && result.attendance_date === currentBusinessDate;

        return new Response(JSON.stringify({
          ...result,
          isWorking,
          attendanceStatus: result.attendanceStatus,
          checkInAt: result.checkInAt,
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

      try {
        await env.DB.prepare("ALTER TABLE ccas ADD COLUMN pending_venue_id TEXT").run();
      } catch (e: any) { }

      if (venueIdParam) {
        query += " WHERE (c.venue_id = ? OR c.pending_venue_id = ?)";
        queryParams.push(venueIdParam, venueIdParam);
      }

      const { results } = await env.DB.prepare(query).bind(...queryParams).all();

      const formattedResults = results.map((c: any) => {
        const isWorking = c.attendanceStatus === 'checked_in' && c.attendance_date === currentBusinessDate;
        return {
          ...c,
          isWorking,
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
          pendingVenueId: c.pending_venue_id,
          status: (venueIdParam && c.pending_venue_id === venueIdParam) ? 'applicant' : c.status,
          originalStatus: c.status,
          isNew: c.is_new === 1,
          attendanceStatus: c.attendanceStatus,
          checkInAt: c.checkInAt
        };
      });

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

      const f_realNameFirst = realNameFirst ?? real_name_first ?? null;
      const f_realNameMiddle = realNameMiddle ?? real_name_middle ?? null;
      const f_realNameLast = realNameLast ?? real_name_last ?? null;
      const f_oneLineStory = oneLineStory ?? one_line_story ?? null;
      const f_sns = sns ?? sns_links ?? null;
      const f_experienceHistory = experienceHistory ?? experience_history ?? null;
      const f_maritalStatus = maritalStatus ?? marital_status ?? null;
      const f_childrenStatus = childrenStatus ?? children_status ?? null;
      const f_specialNotes = specialNotes ?? special_notes ?? null;
      let f_venueId = venueId ?? venue_id ?? null; // 수정 전 venueId
      const f_isNew = isNew ?? is_new ?? null;
      const f_languages = languages ?? null;
      const f_specialties = specialties ?? null;
      const f_name = nickname ?? name ?? null;
      const isProfileUpdate = body.isProfileUpdate === true;

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
          pets || ''
        ).run();

        return new Response(JSON.stringify({ success: true, id: targetId }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // UPDATE
        const updateId = id || bodyId;

        // --- 승인 시스템 로직 ---
        let currentStatus = status ?? null;

        try {
          await env.DB.prepare("ALTER TABLE ccas ADD COLUMN pending_venue_id TEXT").run();
        } catch (e) { }

        const currentData = await env.DB.prepare("SELECT venue_id, pending_venue_id FROM ccas WHERE id = ?").bind(updateId).first();

        if (currentData) {
          // 1. CCA가 프로필 페이지에서 업소를 변경하는 경우 -> 바로 변경하지 않고 pending_venue_id 로 저장
          if (isProfileUpdate && f_venueId && currentData.venue_id !== f_venueId) {
            await env.DB.prepare("UPDATE ccas SET pending_venue_id = ? WHERE id = ?").bind(f_venueId, updateId).run();
            f_venueId = null; // 메인 업데이트 구문에서는 venue_id를 변경하지 않도록 null 처리
          }

          // 2. 다른 JTV 관리자가 AdminCCAs에서 'Acceptance of Employment' (status: 'active') 를 눌렀을 때
          if (!isProfileUpdate && currentStatus === 'active' && currentData.pending_venue_id) {
            // 대기중인 업소를 실제 소속으로 확정
            f_venueId = currentData.pending_venue_id;
            await env.DB.prepare("UPDATE ccas SET pending_venue_id = NULL WHERE id = ?").bind(updateId).run();
          }

          // 3. 다른 JTV 관리자가 AdminCCAs에서 'Decline' (status: 'inactive') 를 눌렀을 때
          if (!isProfileUpdate && currentStatus === 'inactive' && currentData.pending_venue_id) {
            // 이전 소속은 유지하고 pending_venue_id 만 삭제
            await env.DB.prepare("UPDATE ccas SET pending_venue_id = NULL WHERE id = ?").bind(updateId).run();
            currentStatus = null; // 원래 소속 업소에서는 active 상태여야 하므로 status 변경을 무시함
          }
        }

        const paramsList = [
          f_name,
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
          f_maritalStatus,
          f_childrenStatus,
          f_specialNotes,
          image || null,
          f_venueId,
          password || null,
          f_languages ? JSON.stringify(f_languages) : null,
          f_isNew !== null ? (f_isNew ? 1 : 0) : null,
          weight || null,
          drinking || null,
          smoking || null,
          pets || null,
          f_specialties ? JSON.stringify(f_specialties) : null,
          currentStatus,
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

      // 0. Ensure tables exist before deletion to avoid "no such table" errors
      try {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS gallery (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, type TEXT NOT NULL, url TEXT NOT NULL, caption TEXT, likes INTEGER DEFAULT 0, shares INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_holidays (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, holiday_date TEXT NOT NULL, UNIQUE(cca_id, holiday_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_sold_out (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, holiday_date TEXT NOT NULL, UNIQUE(cca_id, holiday_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_attendance (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, venue_id TEXT NOT NULL, check_in_at DATETIME, check_out_at DATETIME, attendance_date TEXT NOT NULL, status TEXT DEFAULT 'checked_in', UNIQUE(cca_id, attendance_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_messages (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, customer_name TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, replied INTEGER DEFAULT 0, reply_text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, replied_at DATETIME)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_messages (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, cca_id TEXT NOT NULL, sender_name TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, priority TEXT DEFAULT 'normal', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_point_logs (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, category_id TEXT, name TEXT NOT NULL, amount REAL NOT NULL, quantity INTEGER DEFAULT 1, total REAL NOT NULL, description TEXT, log_date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_employment_history (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, venue_id TEXT NOT NULL, join_date TEXT NOT NULL, leave_date TEXT, status TEXT)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS hero_sections (id INTEGER PRIMARY KEY AUTOINCREMENT, cca_id TEXT, badge1 TEXT, badge2 TEXT, title TEXT, content TEXT, button_text TEXT, button_link TEXT, image_url TEXT, display_order INTEGER)").run();
      } catch (e) {
        console.error("Initialization error during CCA delete:", e);
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
        env.DB.prepare("DELETE FROM hero_sections WHERE cca_id = ?").bind(id),
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
