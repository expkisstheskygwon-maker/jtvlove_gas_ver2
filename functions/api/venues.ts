// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

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

      const keys = Object.keys(updates);
      if (keys.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const setClause = keys.map(key => `${key} = ?`).join(", ");
      const values = keys.map(key => {
        const val = updates[key];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
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

  return new Response("Method not allowed", { status: 405 });
};