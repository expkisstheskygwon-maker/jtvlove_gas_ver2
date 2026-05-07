
type D1Database = any;
interface Env { DB: D1Database; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const userId = url.searchParams.get('userId');
        const type = url.searchParams.get('type'); // 'system', 'private'

        if (!userId) return new Response("userId required", { status: 400 });

        try {
            let query = "SELECT * FROM user_notifications WHERE user_id = ?";
            const params = [userId];

            if (type) {
                query += " AND type = ?";
                params.push(type);
            }

            query += " ORDER BY created_at DESC";

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    if (request.method === 'PATCH') {
        try {
            const { id, userId, all, is_read } = await request.json();

            if (all && userId) {
                // Mark all as read for user
                await env.DB.prepare("UPDATE user_notifications SET is_read = ? WHERE user_id = ?")
                    .bind(is_read ? 1 : 0, userId).run();
            } else if (id) {
                // Mark single as read
                await env.DB.prepare("UPDATE user_notifications SET is_read = ? WHERE id = ?")
                    .bind(is_read ? 1 : 0, id).run();
            } else {
                return new Response("id or (all and userId) required", { status: 400 });
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
