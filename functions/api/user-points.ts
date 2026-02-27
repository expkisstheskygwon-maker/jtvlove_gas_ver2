
type D1Database = any;
interface Env { DB: D1Database; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    if (request.method === 'GET') {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response("userId required", { status: 400 });

        try {
            const { results } = await env.DB.prepare(
                "SELECT * FROM user_point_logs WHERE user_id = ? ORDER BY created_at DESC"
            ).bind(userId).all();
            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
