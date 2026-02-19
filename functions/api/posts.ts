// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  
  // GET: 리스트 조회 또는 상세 조회
  if (request.method === "GET") {
    const board = url.searchParams.get("board");
    const id = url.searchParams.get("id");

    try {
      let query = "SELECT * FROM posts";
      let params: any[] = [];

      if (id) {
        query += " WHERE id = ?";
        params.push(id);
      } else if (board) {
        query += " WHERE board = ?";
        params.push(board);
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
      const id = crypto.randomUUID();
      const { board, title, author, content, image } = body;

      await env.DB.prepare(
        "INSERT INTO posts (id, board, title, author, content, image, views, likes) VALUES (?, ?, ?, ?, ?, ?, 0, 0)"
      ).bind(id, board, title, author, content, image || null).run();

      const newPost = { id, board, title, author, content, image, views: 0, likes: 0, created_at: new Date().toISOString() };
      
      return new Response(JSON.stringify(newPost), {
        status: 201,
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