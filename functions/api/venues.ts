// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

const VENUE_COLUMNS = [
  'id', 'name', 'region', 'rating', 'reviews_count', 'description', 'image', 'banner_image',
  'phone', 'address', 'introduction', 'tags', 'features', 'sns', 'operating_hours',
  'showUpTime', 'media', 'menu', 'tables', 'rooms', 'owner_id'
];

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");

  const normalizeUrl = (u: string) => {
    if (u && u.startsWith('https://r2.jtvstar.com/')) {
      const key = u.replace('https://r2.jtvstar.com/', '');
      return `/api/r2?key=${encodeURIComponent(key)}`;
    }
    return u;
  };

  // GET: 업소 목록 또는 특정 업소 조회
  if (request.method === "GET") {
    try {
      let query = "SELECT * FROM venues";
      let params: any[] = [];

      if (idParam) {
        query += " WHERE id = ?";
        params.push(idParam);
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();

      // JSON 필드 파싱
      const formattedResults = results.map((v: any) => ({
        ...v,
        image: normalizeUrl(v.image),
        banner_image: normalizeUrl(v.banner_image),
        tags: v.tags ? JSON.parse(v.tags) : [],
        features: v.features ? JSON.parse(v.features) : [],
        sns: v.sns ? JSON.parse(v.sns) : null,
        operating_hours: v.operating_hours ? JSON.parse(v.operating_hours) : null,
        media: v.media ? JSON.parse(v.media) : [],
        menu: v.menu ? JSON.parse(v.menu) : [],
        tables: v.tables ? JSON.parse(v.tables) : [],
        rooms: v.rooms ? JSON.parse(v.rooms) : []
      }));

      if (idParam && formattedResults.length === 0) {
        return new Response(JSON.stringify({ error: "Venue not found" }), { status: 404 });
      }

      return new Response(idParam ? JSON.stringify(formattedResults[0]) : JSON.stringify(formattedResults), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // PATCH: 업소 정보 업데이트
  if (request.method === "PATCH") {
    try {
      const body = await request.json() as any;
      const { id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Venue ID is required" }), { status: 400 });
      }

      // Filter updates to include only valid columns
      const keys = Object.keys(updates).filter(key => VENUE_COLUMNS.includes(key));

      if (keys.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const setClause = keys.map(key => `${key} = ?`).join(", ");
      const values = keys.map(key => {
        const val = updates[key];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val ?? null;
      });

      await env.DB.prepare(
        `UPDATE venues SET ${setClause} WHERE id = ?`
      ).bind(...values, id).run();

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

  // POST: 새로운 업소 등록
  if (request.method === "POST") {
    try {
      const body = await request.json() as any;
      const { id, ...data } = body;
      const targetId = id || `v_${Date.now()}`;

      // Filter data to include only valid columns
      const filteredData: any = {};
      Object.keys(data).forEach(key => {
        if (VENUE_COLUMNS.includes(key) && key !== 'id') {
          filteredData[key] = data[key];
        }
      });

      const keys = Object.keys(filteredData);
      const columns = ['id', ...keys].join(", ");
      const placeholders = ['?', ...keys.map(() => "?")].join(", ");
      const values = [targetId, ...keys.map(key => {
        const val = filteredData[key];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val ?? null;
      })];

      await env.DB.prepare(
        `INSERT INTO venues (${columns}) VALUES (${placeholders})`
      ).bind(...values).run();

      return new Response(JSON.stringify({ success: true, id: targetId }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE: 업소 삭제
  if (request.method === "DELETE") {
    try {
      if (!idParam) {
        return new Response(JSON.stringify({ error: "Venue ID is required" }), { status: 400 });
      }

      // 0. Ensure tables exist before deletion to avoid "no such table" errors
      try {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS gallery (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, type TEXT NOT NULL, url TEXT NOT NULL, caption TEXT, likes INTEGER DEFAULT 0, shares INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_holidays (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, holiday_date TEXT NOT NULL, UNIQUE(cca_id, holiday_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_sold_out (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, holiday_date TEXT NOT NULL, UNIQUE(cca_id, holiday_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_messages (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, customer_name TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, replied INTEGER DEFAULT 0, reply_text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, replied_at DATETIME)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_point_logs (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, category_id TEXT, name TEXT NOT NULL, amount REAL NOT NULL, quantity INTEGER DEFAULT 1, total REAL NOT NULL, description TEXT, log_date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_messages (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, cca_id TEXT NOT NULL, sender_name TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, priority TEXT DEFAULT 'normal', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_attendance (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, venue_id TEXT NOT NULL, check_in_at DATETIME, check_out_at DATETIME, attendance_date TEXT NOT NULL, status TEXT DEFAULT 'checked_in', UNIQUE(cca_id, attendance_date))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_employment_history (id TEXT PRIMARY KEY, cca_id TEXT NOT NULL, venue_id TEXT NOT NULL, join_date TEXT NOT NULL, leave_date TEXT, status TEXT)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS hero_sections (id INTEGER PRIMARY KEY AUTOINCREMENT, cca_id TEXT, badge1 TEXT, badge2 TEXT, title TEXT, content TEXT, button_text TEXT, button_link TEXT, image_url TEXT, display_order INTEGER)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS venue_notices (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, is_pinned INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cca_point_categories (id TEXT PRIMARY KEY, venue_id TEXT NOT NULL, name TEXT NOT NULL, amount REAL NOT NULL, type TEXT DEFAULT 'point')").run();
      } catch (e) {
        console.error("Initialization error during delete:", e);
      }

      // Manual cascade deletion to avoid foreign key constraints
      await env.DB.batch([
        env.DB.prepare("DELETE FROM gallery WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM cca_holidays WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM cca_sold_out WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM customer_messages WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM cca_point_logs WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM admin_messages WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM cca_attendance WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM cca_employment_history WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM hero_sections WHERE cca_id IN (SELECT id FROM ccas WHERE venue_id = ?)").bind(idParam),
        env.DB.prepare("DELETE FROM venue_notices WHERE venue_id = ?").bind(idParam),
        env.DB.prepare("DELETE FROM reservations WHERE venue_id = ?").bind(idParam),
        env.DB.prepare("DELETE FROM cca_point_categories WHERE venue_id = ?").bind(idParam),
        env.DB.prepare("DELETE FROM ccas WHERE venue_id = ?").bind(idParam),
        env.DB.prepare("DELETE FROM venues WHERE id = ?").bind(idParam)
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