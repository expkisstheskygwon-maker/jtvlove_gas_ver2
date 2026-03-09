export const onRequest = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    // 0. Ensure tables exist (Defensive)
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            )
        `).run();

        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS comment_reactions (
                comment_id TEXT NOT NULL,
                user_id TEXT,
                ip_address TEXT,
                type TEXT NOT NULL, -- 'like', 'dislike'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (comment_id, user_id, ip_address)
            )
        `).run();
    } catch (e) {
        console.error("Table initialization error in comments.ts:", e);
    }

    // GET: 특정 게시글의 댓글 조회
    if (request.method === "GET") {
        const postId = url.searchParams.get("postId");
        if (!postId) return new Response("Post ID required", { status: 400 });

        try {
            const { results } = await env.DB.prepare(
                "SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC"
            ).bind(postId).all();

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

    // POST: 신규 댓글 작성
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { postId, author, content } = body;

            if (!postId || !author || !content) {
                throw new Error("Missing required fields");
            }

            // Check if user is banned
            const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ? OR nickname = ?").bind(author, author).first();
            if (userCheck && userCheck.status === 'banned') {
                return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다. 댓글을 작성할 수 없습니다." }), {
                    status: 403, headers: { "Content-Type": "application/json" },
                });
            }

            const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            await env.DB.prepare(
                "INSERT INTO post_comments (id, post_id, author, content, likes, dislikes) VALUES (?, ?, ?, ?, 0, 0)"
            ).bind(id, postId, author, content).run();

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

    // PATCH: 댓글 추천/비추천 (어뷰징 방지 및 작성자 본인 제한)
    if (request.method === "PATCH") {
        const id = url.searchParams.get("id");
        const action = url.searchParams.get("action"); // 'like' or 'dislike'
        const userId = url.searchParams.get("userId") || "anonymous";

        if (!id || !action) return new Response("ID and action required", { status: 400 });

        try {
            // Check if user is banned
            const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ?").bind(userId).first();
            if (userCheck && userCheck.status === 'banned') {
                return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다." }), {
                    status: 403, headers: { "Content-Type": "application/json" },
                });
            }

            // Check if comment exists and get author
            const comment = await env.DB.prepare("SELECT author FROM post_comments WHERE id = ?").bind(id).first();
            if (!comment) return new Response("Comment not found", { status: 404 });

            // Author restriction
            if (comment.author === userId) {
                return new Response(JSON.stringify({ error: "Cannot react to your own comment" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // Check if already reacted
            const existing = await env.DB.prepare(
                "SELECT type FROM comment_reactions WHERE comment_id = ? AND (user_id = ? OR ip_address = ?)"
            ).bind(id, userId, ip).first();

            if (existing) {
                return new Response(JSON.stringify({ error: "Already reacted to this comment" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }

            let query = "";
            if (action === "like") {
                query = "UPDATE post_comments SET likes = likes + 1 WHERE id = ?";
            } else if (action === "dislike") {
                query = "UPDATE post_comments SET dislikes = dislikes + 1 WHERE id = ?";
            } else {
                return new Response("Invalid action", { status: 400 });
            }

            // Transactional (Batch)
            await env.DB.batch([
                env.DB.prepare("INSERT INTO comment_reactions (comment_id, user_id, ip_address, type) VALUES (?, ?, ?, ?)").bind(id, userId, ip, action),
                env.DB.prepare(query).bind(id)
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

    // DELETE: 댓글 삭제
    if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("ID required", { status: 400 });
        try {
            await env.DB.prepare("DELETE FROM post_comments WHERE id = ?").bind(id).run();
            await env.DB.prepare("DELETE FROM comment_reactions WHERE comment_id = ?").bind(id).run();
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
