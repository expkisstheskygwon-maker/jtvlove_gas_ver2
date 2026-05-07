
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
    if (request.method === 'PATCH') {
        try {
            const { id, email, password, nickname, phone, profile_image } = await request.json();

            if (!id) {
                return new Response(JSON.stringify({ error: "User ID missing" }), { status: 400 });
            }

            // Dynamically build the update query based on provided fields
            const updates = [];
            const values = [];

            if (email !== undefined) {
                updates.push("email = ?");
                values.push(email);
            }
            if (password !== undefined && password.trim() !== "") {
                updates.push("password = ?");
                values.push(password);
            }
            if (phone !== undefined) {
                updates.push("phone = ?");
                values.push(phone);
            }
            if (nickname !== undefined) {
                updates.push("nickname = ?");
                values.push(nickname);
            }
            if (profile_image !== undefined) {
                updates.push("profile_image = ?");
                values.push(profile_image);
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
            }

            values.push(id);

            const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

            await env.DB.prepare(query).bind(...values).run();

            // Sync to ccas table if nickname or profile_image changed
            try {
                const ccaUpdates = [];
                const ccaValues = [];
                if (nickname !== undefined) {
                    ccaUpdates.push("nickname = ?");
                    ccaValues.push(nickname);
                }
                if (profile_image !== undefined) {
                    ccaUpdates.push("image = ?");
                    ccaValues.push(profile_image);
                }

                if (ccaUpdates.length > 0) {
                    ccaValues.push(id);
                    await env.DB.prepare(`UPDATE ccas SET ${ccaUpdates.join(", ")} WHERE id = ?`).bind(...ccaValues).run();
                }
            } catch (syncError) {
                // Ignore if CCA record doesn't exist
                console.error("Sync to CCAs failed:", syncError);
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            if (error.message.includes("UNIQUE")) {
                return new Response(JSON.stringify({ error: "Email already exists" }), { status: 400 });
            }
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    // GET: Single user info or Bulk fetch by IDs
    if (request.method === 'GET') {
        const userId = url.searchParams.get('id');
        const idsParam = url.searchParams.get('ids');

        try {
            if (idsParam) {
                const ids = idsParam.split(',').filter(id => id.trim() !== '');
                if (ids.length === 0) return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });

                // Construct query with multiple placeholders
                const placeholders = ids.map(() => '?').join(',');
                const query = `SELECT id, nickname, real_name, profile_image FROM users WHERE id IN (${placeholders})`;
                const { results } = await env.DB.prepare(query).bind(...ids).all();

                return new Response(JSON.stringify((results || []).map((u: any) => ({
                    id: u.id,
                    nickname: u.nickname,
                    realName: u.real_name,
                    profileImage: u.profile_image
                }))), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (!userId) return new Response("userId is required", { status: 400 });

            const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
            if (!user) return new Response("User not found", { status: 404 });

            const getNextLevelXp = (lvl: number) => Math.floor(80 * Math.pow(1.05, lvl - 1));
            const nextLevelXp = getNextLevelXp(user.level);

            const responseData = {
                ...user,
                realName: user.real_name,
                totalXp: user.total_xp,
                dailyXp: user.daily_xp,
                profileImage: user.profile_image,
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
