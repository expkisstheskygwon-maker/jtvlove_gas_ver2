// functions/api/subscriptions.ts
interface Env { DB: any; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    // Auto-migrate
    try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS user_subscriptions (
            id TEXT PRIMARY KEY,
            subscriber_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            price_paid INTEGER DEFAULT 0,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(subscriber_id, target_id)
          )
        `).run();
        // Add columns if they don't exist
        try { await env.DB.prepare("ALTER TABLE user_subscriptions ADD COLUMN price_paid INTEGER DEFAULT 0").run(); } catch(e) {}
        try { await env.DB.prepare("ALTER TABLE user_subscriptions ADD COLUMN expires_at DATETIME").run(); } catch(e) {}
    } catch (e) { }

    // GET: Check subscription status or list subscribers/subscriptions
    if (request.method === "GET") {
        const subscriberId = url.searchParams.get("subscriberId");
        const targetId = url.searchParams.get("targetId");

        try {
            if (subscriberId && targetId) {
                // Check specific status
                const sub = await env.DB.prepare(
                    "SELECT * FROM user_subscriptions WHERE subscriber_id = ? AND target_id = ? AND (expires_at IS NULL OR expires_at > datetime('now')) AND status = 'active'"
                ).bind(subscriberId, targetId).first();
                return new Response(JSON.stringify({ isSubscribed: !!sub, subscription: sub }), { headers });
            } else if (subscriberId) {
                // List what I am subscribing to
                const { results } = await env.DB.prepare(
                    "SELECT target_id FROM user_subscriptions WHERE subscriber_id = ? AND (expires_at IS NULL OR expires_at > datetime('now')) AND status = 'active'"
                ).bind(subscriberId).all();
                return new Response(JSON.stringify({ subscribedIds: results.map((r: any) => r.target_id) }), { headers });
            } else if (targetId) {
                // List who is subscribing to me
                const { results } = await env.DB.prepare(
                    "SELECT subscriber_id FROM user_subscriptions WHERE target_id = ? AND (expires_at IS NULL OR expires_at > datetime('now')) AND status = 'active'"
                ).bind(targetId).all();
                return new Response(JSON.stringify({ subscriberIds: results.map((r: any) => r.subscriber_id) }), { headers });
            } else {
                return new Response(JSON.stringify({ error: "subscriberId or targetId is required" }), { status: 400, headers });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // POST: Subscribe (Paid)
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { subscriberId, targetId, action } = body; // action: 'subscribe' | 'cancel'

            if (!subscriberId || !targetId) {
                return new Response(JSON.stringify({ error: "subscriberId and targetId are required" }), { status: 400, headers });
            }

            if (action === 'cancel') {
                await env.DB.prepare(
                    "UPDATE user_subscriptions SET status = 'cancelled' WHERE subscriber_id = ? AND target_id = ?"
                ).bind(subscriberId, targetId).run();
                return new Response(JSON.stringify({ success: true, isSubscribed: false }), { headers });
            }

            // 1. Get CCA Subscription Cost
            const cca = await env.DB.prepare("SELECT subscription_cost FROM ccas WHERE id = ?").bind(targetId).first();
            if (!cca) return new Response(JSON.stringify({ error: "CCA not found" }), { status: 404 });
            const cost = cca.subscription_cost || 0;

            // 2. Check User Points
            const user = await env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(subscriberId).first();
            if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

            if (user.points < cost) {
                return new Response(JSON.stringify({ error: "포인트가 부족합니다.", code: 'INSUFFICIENT_POINTS', required: cost, current: user.points }), { status: 400, headers });
            }

            // 3. Transactional Update (Cloudflare D1 batch)
            const batch = [
                // Deduct points
                env.DB.prepare("UPDATE users SET points = points - ? WHERE id = ?").bind(cost, subscriberId),
                // Log point usage
                env.DB.prepare("INSERT INTO user_point_logs (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)")
                   .bind(`upl_${Date.now()}`, subscriberId, -cost, 'use', `구독: ${targetId}`),
                // Insert/Update Subscription
                env.DB.prepare(`
                    INSERT INTO user_subscriptions (id, subscriber_id, target_id, status, price_paid, expires_at)
                    VALUES (?, ?, ?, 'active', ?, datetime('now', '+30 days'))
                    ON CONFLICT(subscriber_id, target_id) DO UPDATE SET
                      status = 'active',
                      price_paid = excluded.price_paid,
                      expires_at = datetime('now', '+30 days'),
                      created_at = CURRENT_TIMESTAMP
                `).bind(`sub_${Date.now()}`, subscriberId, targetId, cost)
            ];

            await env.DB.batch(batch);

            // Notify target user
            try {
                const subscriber = await env.DB.prepare("SELECT nickname FROM users WHERE id = ?").bind(subscriberId).first();
                const subscriberName = subscriber?.nickname || '누군가';
                const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await env.DB.prepare(`
                    INSERT INTO user_notifications (id, user_id, type, sender_name, title, content)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                    notifId,
                    targetId,
                    'system',
                    subscriberName,
                    '새 구독',
                    `${subscriberName}님이 회원님을 구독했습니다.`
                ).run();
            } catch (e) {
                console.error("Subscription notification failed", e);
            }

            return new Response(JSON.stringify({ success: true, isSubscribed: true, cost }), { headers });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
