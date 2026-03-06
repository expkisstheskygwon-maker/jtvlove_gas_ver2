// functions/api/message-search.ts - 수신자 검색 API (Latest Fixes: 2026-03-06 21:00)
interface Env { DB: any; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
    }

    const query = url.searchParams.get("q") || "";
    const type = url.searchParams.get("type") || "all"; // 'user' | 'cca' | 'venue' | 'all'

    if (!query || query.length < 1) {
        return new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" },
        });
    }

    const searchTerm = `%${query}%`;
    const results: any[] = [];

    try {
        // Search users
        if (type === "all" || type === "user") {
            try {
                const { results: users } = await env.DB.prepare(
                    `SELECT id, nickname, email, 'user' as type FROM users WHERE nickname LIKE ? OR email LIKE ? LIMIT 10`
                ).bind(searchTerm, searchTerm).all();
                if (users) {
                    results.push(...users.map((u: any) => ({
                        id: u.id,
                        name: u.nickname || u.email,
                        type: 'user',
                        label: `👤 ${u.nickname || u.email}`
                    })));
                }
            } catch (e) { /* table may not exist */ }
        }

        // Search CCAs
        if (type === "all" || type === "cca") {
            try {
                const { results: ccas } = await env.DB.prepare(
                    `SELECT id, name, nickname, venue_name, 'cca' as type FROM ccas WHERE nickname LIKE ? OR name LIKE ? LIMIT 10`
                ).bind(searchTerm, searchTerm).all();
                if (ccas) {
                    results.push(...ccas.map((c: any) => ({
                        id: c.id,
                        name: c.nickname || c.name,
                        type: 'cca',
                        label: `💃 ${c.nickname || c.name} (${c.venue_name || ''})`
                    })));
                }
            } catch (e) { /* table may not exist */ }
        }

        // Search venues
        if (type === "all" || type === "venue") {
            try {
                const { results: venues } = await env.DB.prepare(
                    `SELECT id, name, 'venue_admin' as type FROM venues WHERE name LIKE ? OR id IN (SELECT id FROM venues WHERE name LIKE ?) LIMIT 10`
                ).bind(searchTerm, searchTerm).all();
                if (venues) {
                    results.push(...venues.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        type: 'venue_admin',
                        label: `🏢 ${v.name}`
                    })));
                }
            } catch (e) { /* table may not exist */ }
        }

        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
        });
    }
};
