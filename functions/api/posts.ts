// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

  // 0. Ensure tables exist (Defensive)
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        board TEXT NOT NULL,
        category TEXT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        image TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        is_secret INTEGER DEFAULT 0,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS post_views (
        post_id TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id, ip_address)
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id, ip_address)
      )
    `).run();
  } catch (e) {
    console.error("Table initialization error in posts.ts:", e);
  }

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

      // 비밀글 처리
      const processedResults = results.map((post: any) => {
        if (post.is_secret && !id) {
          return { ...post, content: "비밀글입니다.", title: "비밀글입니다." };
        }
        return post;
      });

      return new Response(id ? JSON.stringify(processedResults[0]) : JSON.stringify(processedResults), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // PATCH: 조회수 또는 추천수 증가 (어뷰징 방지 포함)
  if (request.method === "PATCH") {
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // 'view' or 'like'
    const userId = url.searchParams.get("userId") || "anonymous";

    if (!id) return new Response("ID required", { status: 400 });

    try {
      if (action === "view") {
        // Check if already viewed
        const existing = await env.DB.prepare(
          "SELECT 1 FROM post_views WHERE post_id = ? AND (user_id = ? OR ip_address = ?)"
        ).bind(id, userId, ip).first();

        if (!existing) {
          await env.DB.prepare(
            "INSERT INTO post_views (post_id, user_id, ip_address) VALUES (?, ?, ?)"
          ).bind(id, userId, ip).run();
          await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(id).run();
        }
      } else if (action === "like") {
        // Check if user is banned
        const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ?").bind(userId).first();
        if (userCheck && userCheck.status === 'banned') {
          return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        // Check if already liked
        const existing = await env.DB.prepare(
          "SELECT 1 FROM post_likes WHERE post_id = ? AND (user_id = ? OR ip_address = ?)"
        ).bind(id, userId, ip).first();

        if (!existing) {
          await env.DB.prepare(
            "INSERT INTO post_likes (post_id, user_id, ip_address) VALUES (?, ?, ?)"
          ).bind(id, userId, ip).run();
          await env.DB.prepare("UPDATE posts SET likes = likes + 1 WHERE id = ?").bind(id).run();
        } else {
          return new Response(JSON.stringify({ error: "Already liked" }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
      } else {
        return new Response("Invalid action", { status: 400 });
      }

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
      // Cascade delete for views and likes (since they are linked by post_id)
      await env.DB.prepare("DELETE FROM post_views WHERE post_id = ?").bind(id).run();
      await env.DB.prepare("DELETE FROM post_likes WHERE post_id = ?").bind(id).run();

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

      const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const { board, category, title, author, content, image, is_secret, password } = body;

      if (!board || !title || !author || !content) {
        throw new Error("Missing required fields: board, title, author, or content");
      }

      // Check if user is banned
      const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ? OR nickname = ?").bind(author, author).first();
      if (userCheck && userCheck.status === 'banned') {
        return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다. 글을 작성할 수 없습니다." }), {
          status: 403, headers: { "Content-Type": "application/json" },
        });
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

  // PUT: 게시글 수정
  if (request.method === "PUT") {
    const id = url.searchParams.get("id");
    if (!id) return new Response("ID required", { status: 400 });

    try {
      const body = await request.json();
      const { category, title, content, image, is_secret, password } = body;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      // Check if user is banned (get author from post)
      const post = await env.DB.prepare("SELECT author FROM posts WHERE id = ?").bind(id).first();
      if (post) {
        const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ? OR nickname = ?").bind(post.author, post.author).first();
        if (userCheck && userCheck.status === 'banned') {
          return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다." }), {
            status: 403, headers: { "Content-Type": "application/json" },
          });
        }
      }

      await env.DB.prepare(
        "UPDATE posts SET category = ?, title = ?, content = ?, image = ?, is_secret = ?, password = ? WHERE id = ?"
      ).bind(
        category || null,
        title,
        content,
        image || null,
        is_secret ? 1 : 0,
        password || null,
        id
      ).run();

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