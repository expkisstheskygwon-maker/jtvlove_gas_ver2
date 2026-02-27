// Cloudflare worker types
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const userId = url.searchParams.get('id');
        const nickname = url.searchParams.get('nickname');

        if (!userId) return new Response("userId is required", { status: 400 });

        try {
            // Count posts by author nickname (since posts use author TEXT)
            const postsCountResult = nickname ? await env.DB.prepare("SELECT COUNT(*) as count FROM posts WHERE author = ?").bind(nickname).first() : { count: 0 };
            const postsCount = postsCountResult?.count || 0;

            // Count bookings by user_id (if added) or just placeholder for now
            // Let's assume we match reservations by customer_contact or user_id eventually. 
            // We'll return 0 if no user_id column exists yet, or check if it exists:
            let bookingsCount = 0;
            try {
                const bkRes = await env.DB.prepare("SELECT COUNT(*) as count FROM reservations WHERE customer_name = ?").bind(nickname).first();
                bookingsCount = bkRes?.count || 0;
            } catch (e) { /* ignore if column/table err */ }

            // Fetch notifications
            const notifications = await env.DB.prepare("SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();

            return new Response(JSON.stringify({
                bookings: bookingsCount,
                posts: postsCount,
                notifications: notifications.results || [],
                unread_notifications: (notifications.results || []).filter((n: any) => !n.is_read).length
            }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
