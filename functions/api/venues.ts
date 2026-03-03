// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

const VENUE_COLUMNS = [
  'id', 'name', 'region', 'rating', 'reviews_count', 'description', 'image', 'banner_image',
  'phone', 'address', 'introduction', 'tags', 'features', 'sns', 'operating_hours',
  'showUpTime', 'media', 'menu', 'tables', 'rooms'
];

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");

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

  return new Response("Method not allowed", { status: 405 });
};