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

      // 비밀글 처리: 비밀번호가 있으면 내용을 마스킹하거나 클라이언트에서 처리하도록 필드 유지
      // 실제 보안이 중요하다면 여기서 password 검증 로직이 들어가야 함
      const processedResults = results.map((post: any) => {
        if (post.is_secret && !id) {
          return { ...post, content: "비밀글입니다.", title: "비밀글입니다." };
        }
        return post;
      });

      return new Response(JSON.stringify(id ? processedResults[0] : processedResults), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // PATCH: 조회수 또는 추천수 증가
  if (request.method === "PATCH") {
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'view' or 'like'

    if (!id) return new Response("ID required", { status: 400 });

    try {
      let query = "";
      if (action === "view") {
        query = "UPDATE posts SET views = views + 1 WHERE id = ?";
      } else if (action === "like") {
        query = "UPDATE posts SET likes = likes + 1 WHERE id = ?";
      } else {
        return new Response("Invalid action", { status: 400 });
      }

      await env.DB.prepare(query).bind(id).run();
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

  // DELETE: 게시글 삭제
  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return new Response("ID required", { status: 400 });

    try {
      await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
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

  // POST: 신규 게시글 작성
  if (request.method === "POST") {
    try {
      const body = await request.json();
      if (!body) throw new Error("Request body is empty");

      let id;
      try {
        id = crypto.randomUUID();
      } catch (e) {
        id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      const { board, category, title, author, content, image, is_secret, password } = body;

      if (!board || !title || !author || !content) {
        throw new Error("Missing required fields: board, title, author, or content");
      }

      if (!env.DB) {
        throw new Error("D1 Database binding 'DB' is not configured.");
      }

      await env.DB.prepare(
        "INSERT INTO posts (id, board, category, title, author, content, image, is_secret, password, views, likes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)"
      ).bind(
        id,
        board,
        category || null,
        title,
        author,
        content,
        image || null,
        is_secret ? 1 : 0,
        password || null
      ).run();

      return new Response(JSON.stringify({ id, success: true }), {
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