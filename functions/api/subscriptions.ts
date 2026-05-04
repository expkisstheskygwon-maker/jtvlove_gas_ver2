// functions/api/subscriptions.ts
interface Env { DB: any; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    // Ensure table exists
    try {
        await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id TEXT PRIMARY KEY,
        subscriber_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(subscriber_id, target_id)
      )
    `).run();
    } catch (e) { /* table already exists */ }

    // GET: Check subscription status or list subscriptions
    if (request.method === "GET") {
        const subscriberId = url.searchParams.get("subscriberId");
        const targetId = url.searchParams.get("targetId");

        if (!subscriberId) {
            return new Response(JSON.stringify({ error: "subscriberId is required" }), { status: 400, headers });
        }

        try {
            if (targetId) {
                // Check specific subscription
                const sub = await env.DB.prepare(
                    "SELECT * FROM user_subscriptions WHERE subscriber_id = ? AND target_id = ? AND status = 'active'"
                ).bind(subscriberId, targetId).first();
                return new Response(JSON.stringify({ isSubscribed: !!sub, subscription: sub }), { headers });
            } else {
                // List all subscriptions
                const { results } = await env.DB.prepare(
                    "SELECT target_id FROM user_subscriptions WHERE subscriber_id = ? AND status = 'active'"
                ).bind(subscriberId).all();
                return new Response(JSON.stringify({ subscribedIds: results.map((r: any) => r.target_id) }), { headers });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // POST: Toggle subscription (Subscribe/Unsubscribe)
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { subscriberId, targetId } = body;

            if (!subscriberId || !targetId) {
                return new Response(JSON.stringify({ error: "subscriberId and targetId are required" }), { status: 400, headers });
            }

            if (subscriberId === targetId) {
                return new Response(JSON.stringify({ error: "Cannot subscribe to yourself" }), { status: 400, headers });
            }

            const existing = await env.DB.prepare(
                "SELECT id FROM user_subscriptions WHERE subscriber_id = ? AND target_id = ?"
            ).bind(subscriberId, targetId).first();

            if (existing) {
                // Toggle / Unsubscribe (for now, just delete or set status)
                await env.DB.prepare(
                    "DELETE FROM user_subscriptions WHERE subscriber_id = ? AND target_id = ?"
                ).bind(subscriberId, targetId).run();
                return new Response(JSON.stringify({ success: true, isSubscribed: false }), { headers });
            } else {
                // Subscribe
                const id = `sub_${Date.now()}`;
                await env.DB.prepare(
                    "INSERT INTO user_subscriptions (id, subscriber_id, target_id) VALUES (?, ?, ?)"
                ).bind(id, subscriberId, targetId).run();
                return new Response(JSON.stringify({ success: true, isSubscribed: true }), { headers });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
