// functions/api/user-follows.ts — 유저 간 팔로우 API
interface Env { DB: any; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    // Ensure table exists
    try {
        await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `).run();
    } catch (e) { /* table already exists */ }

    // GET: Check follow status or list follows
    if (request.method === "GET") {
        const followerId = url.searchParams.get("followerId");
        const followingId = url.searchParams.get("followingId");
        const mode = url.searchParams.get("mode"); // 'followers' | 'following'

        if (!followerId && !followingId) {
            return new Response(JSON.stringify({ error: "followerId or followingId required" }), { status: 400, headers });
        }

        try {
            // Check specific follow relationship
            if (followerId && followingId) {
                const row = await env.DB.prepare(
                    "SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?"
                ).bind(followerId, followingId).first();
                return new Response(JSON.stringify({ isFollowing: !!row }), { headers });
            }

            // List followers of a user
            if (mode === 'followers' && followingId) {
                const { results } = await env.DB.prepare(
                    "SELECT follower_id FROM user_follows WHERE following_id = ?"
                ).bind(followingId).all();
                const followerCount = results ? results.length : 0;
                return new Response(JSON.stringify({
                    followerIds: results.map((r: any) => r.follower_id),
                    count: followerCount
                }), { headers });
            }

            // List users that followerId is following
            if (followerId) {
                const { results } = await env.DB.prepare(
                    "SELECT following_id FROM user_follows WHERE follower_id = ?"
                ).bind(followerId).all();
                const followingCount = results ? results.length : 0;
                return new Response(JSON.stringify({
                    followingIds: results.map((r: any) => r.following_id),
                    count: followingCount
                }), { headers });
            }

            return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400, headers });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // POST: Toggle follow
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { followerId, followingId } = body;

            if (!followerId || !followingId) {
                return new Response(JSON.stringify({ error: "followerId and followingId are required" }), { status: 400, headers });
            }

            if (followerId === followingId) {
                return new Response(JSON.stringify({ error: "Cannot follow yourself" }), { status: 400, headers });
            }

            const existing = await env.DB.prepare(
                "SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?"
            ).bind(followerId, followingId).first();

            if (existing) {
                // Unfollow
                await env.DB.prepare(
                    "DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?"
                ).bind(followerId, followingId).run();
                return new Response(JSON.stringify({ success: true, isFollowing: false }), { headers });
            } else {
                // Follow
                const id = `uf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await env.DB.prepare(
                    "INSERT INTO user_follows (id, follower_id, following_id) VALUES (?, ?, ?)"
                ).bind(id, followerId, followingId).run();
                return new Response(JSON.stringify({ success: true, isFollowing: true }), { headers });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
