// functions/api/user-inquiries.ts
type D1Database = any;
interface Env { DB: D1Database; }

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS user_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', 
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME
);
`;

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    // Ensure table exists and has correct columns
    try {
        await env.DB.prepare(INIT_SQL).run();
        // Try adding answer column if it was created with 'response' instead
        try {
            await env.DB.prepare("ALTER TABLE user_inquiries ADD COLUMN answer TEXT").run();
        } catch (colError) {
            // Column already exists, ignore
        }
    } catch (e) {
        console.error("Init table error:", e);
    }

    if (request.method === 'GET') {
        const userId = url.searchParams.get('userId');
        const id = url.searchParams.get('id');

        try {
            if (id) {
                const result = await env.DB.prepare("SELECT * FROM user_inquiries WHERE id = ?").bind(id).first();
                return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
            }

            if (!userId) return new Response("userId required", { status: 400 });

            let query = "SELECT * FROM user_inquiries WHERE user_id = ? ORDER BY created_at DESC";
            let params = [userId];

            if (userId === "all") {
                query = "SELECT * FROM user_inquiries ORDER BY created_at DESC";
                params = [];
            }

            const { results } = await env.DB.prepare(query).bind(...params).all();

            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    if (request.method === 'POST') {
        try {
            const data: any = await request.json();
            const { userId, title, content } = data;

            if (!userId || !title || !content) {
                return new Response("Missing required fields", { status: 400 });
            }

            const id = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO user_inquiries (id, user_id, title, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(id, userId, title, content, 'pending', new Date().toISOString()).run();

            return new Response(JSON.stringify({ success: true, id }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    if (request.method === 'PATCH') {
        try {
            const data: any = await request.json();
            const { id, answer, status } = data;

            if (!id || !answer) {
                return new Response("Missing required fields", { status: 400 });
            }

            await env.DB.prepare(
                "UPDATE user_inquiries SET answer = ?, status = ?, responded_at = ? WHERE id = ?"
            ).bind(answer, status || 'answered', new Date().toISOString(), id).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
