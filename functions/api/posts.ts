// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);

  // GET: 리스트 조회 또는 상세 조회
  if (request.method === "GET") {
    const board = url.searchParams.get("board");
    const category = url.searchParams.get("category");
    const id = url.searchParams.get("id");

    try {
      let query = "SELECT * FROM posts";
      let params: any[] = [];
      let whereClauses: string[] = [];

      if (id) {
        whereClauses.push("id = ?");
        params.push(id);
      } else {
        if (board) {
          whereClauses.push("board = ?");
          params.push(board);
        }
        if (category && category !== "전체") {
          whereClauses.push("category = ?");
          params.push(category);
        }
      }

      if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
      }

      query += " ORDER BY created_at DESC";

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST: 신규 게시글 작성
  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (!body) throw new Error("Request body is empty");

      // ID 생성: crypto.randomUUID() 혹은 폴백
      let id;
      try {
        id = crypto.randomUUID();
      } catch (e) {
        id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const { board, category, title, author, content, image } = body;

      if (!board || !title || !author || !content) {
        throw new Error("Missing required fields: board, title, author, or content");
      }

      if (!env.DB) {
        throw new Error("D1 Database binding 'DB' is not configured.");
      }

      await env.DB.prepare(
        "INSERT INTO posts (id, board, category, title, author, content, image, views, likes) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)"
      ).bind(
        id,
        board,
        category || null,
        title,
        author,
        content,
        image || null
      ).run();

      const newPost = {
        id,
        board,
        category,
        title,
        author,
        content,
        image,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString()
      };

      return new Response(JSON.stringify(newPost), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error('POST /api/posts error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack,
        details: "Database insertion failed. Please check table schema and binding."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};