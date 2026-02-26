
export const onRequest = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

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

    // PATCH: 댓글 추천/비추천
    if (request.method === "PATCH") {
        const id = url.searchParams.get("id");
        const action = url.searchParams.get("action"); // 'like' or 'dislike'

        if (!id || !action) return new Response("ID and action required", { status: 400 });

        try {
            let query = "";
            if (action === "like") {
                query = "UPDATE post_comments SET likes = likes + 1 WHERE id = ?";
            } else if (action === "dislike") {
                query = "UPDATE post_comments SET dislikes = dislikes + 1 WHERE id = ?";
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

    // DELETE: 댓글 삭제
    if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("ID required", { status: 400 });
        try {
            await env.DB.prepare("DELETE FROM post_comments WHERE id = ?").bind(id).run();
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
