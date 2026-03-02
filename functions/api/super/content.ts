
// Cloudflare worker types
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const board = url.searchParams.get('board');

    // GET: List content or get single item
    if (request.method === 'GET') {
        try {
            if (id) {
                const result = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
                return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
            }

            let query = "SELECT * FROM posts WHERE 1=1";
            const params: any[] = [];

            if (board) {
                query += " AND board = ?";
                params.push(board);
            }

            query += " ORDER BY created_at DESC";

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // POST: Create new item
    if (request.method === 'POST') {
        try {
            const data = await request.json();
            const { board, title, author, content, image, is_secret } = data;

            if (!board || !title || !content) {
                return new Response(JSON.stringify({ error: "Required fields missing" }), { status: 400 });
            }

            const newId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            await env.DB.prepare(`
                INSERT INTO posts (id, board, title, author, content, image, is_secret, views, likes)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
            `).bind(newId, board, title, author || 'Admin', content, image || null, is_secret || 0).run();

            return new Response(JSON.stringify({ success: true, id: newId }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // PATCH: Update item
    if (request.method === 'PATCH') {
        try {
            const { id, updates } = await request.json();
            if (!id || !updates) {
                return new Response(JSON.stringify({ error: "Missing ID or updates" }), { status: 400 });
            }

            const fieldPairs = Object.keys(updates).map(key => `${key} = ?`);
            const values = Object.values(updates);
            values.push(id);

            const query = `UPDATE posts SET ${fieldPairs.join(", ")} WHERE id = ?`;
            await env.DB.prepare(query).bind(...values).run();

            return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // DELETE: Remove item
    if (request.method === 'DELETE') {
        try {
            if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });
            await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
