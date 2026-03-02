
// Cloudflare worker types
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    // GET: List all users
    if (request.method === 'GET') {
        try {
            // Try to get all columns including status
            const query = `
                SELECT id, email, nickname, real_name, level, total_xp, points, role, 
                (CASE WHEN ROW_NUMBER() OVER (PARTITION BY id) > 0 THEN status ELSE 'active' END) as status, 
                created_at 
                FROM users 
                ORDER BY created_at DESC
            `;
            // Simplified query first to ensure it matches common schema
            const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();

            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            console.error("Admin Users API Error:", error.message);
            // Very basic fallback if something is seriously wrong with specific columns
            try {
                const { results } = await env.DB.prepare("SELECT id, email, nickname, role FROM users").all();
                return new Response(JSON.stringify(results || []), {
                    headers: { "Content-Type": "application/json" },
                });
            } catch (inner) {
                return new Response(JSON.stringify({ error: error.message }), { status: 500 });
            }
        }
    }

    // PATCH: Update user info (Role, Points, Status, etc.)
    if (request.method === 'PATCH') {
        try {
            const { id, updates } = await request.json();

            if (!id || !updates) {
                return new Response(JSON.stringify({ error: "Missing ID or updates" }), { status: 400 });
            }

            const fieldPairs = Object.keys(updates).map(key => `${key} = ?`);
            const values = Object.values(updates);
            values.push(id);

            const query = `UPDATE users SET ${fieldPairs.join(", ")} WHERE id = ?`;
            await env.DB.prepare(query).bind(...values).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // POST: Administrative actions (e.g. Reset Password)
    if (request.method === 'POST') {
        try {
            const { action, userId, payload } = await request.json();

            if (action === 'reset-password') {
                const newPassword = payload || '1234'; // Default temp password
                await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?")
                    .bind(newPassword, userId).run();

                return new Response(JSON.stringify({ success: true, tempPassword: newPassword }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
