
// Cloudflare worker types
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    if (request.method === 'POST') {
        try {
            const { email, password, nickname, realName, phone } = await request.json();

            if (!email || !password || !nickname || !realName) {
                return new Response(JSON.stringify({ error: "Required fields missing" }), { status: 400 });
            }

            const id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            await env.DB.prepare(`
        INSERT INTO users (id, email, password, nickname, real_name, phone, role)
        VALUES (?, ?, ?, ?, ?, ?, 'user')
      `).bind(id, email, password, nickname, realName, phone || null).run();

            return new Response(JSON.stringify({ success: true, id }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            if (error.message.includes("UNIQUE")) {
                return new Response(JSON.stringify({ error: "Email already exists" }), { status: 400 });
            }
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // GET: Single user info (in reality should be authenticated session based)
    if (request.method === 'GET') {
        const userId = url.searchParams.get('id');
        if (!userId) return new Response("userId is required", { status: 400 });

        try {
            const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
            if (!user) return new Response("User not found", { status: 404 });

            // Calculate XP for next level (placeholder logic matching user's table)
            // Level 1: 80, Level 5: 108, Level 10: 159...
            // For simplicity, let's use a function to get next level XP
            const getNextLevelXp = (lvl: number) => Math.floor(80 * Math.pow(1.05, lvl - 1));
            const nextLevelXp = getNextLevelXp(user.level);

            const responseData = {
                ...user,
                realName: user.real_name,
                totalXp: user.total_xp,
                dailyXp: user.daily_xp,
                nextLevelXp,
                quests: user.quests ? JSON.parse(user.quests) : []
            };

            return new Response(JSON.stringify(responseData), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
