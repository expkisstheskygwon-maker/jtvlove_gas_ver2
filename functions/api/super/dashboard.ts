// Cloudflare worker types
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;

    if (request.method !== 'GET') {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const todayStr = new Date().toISOString().split('T')[0];

        const stats = {
            venuesCount: 0, venuesToday: 0,
            ccasCount: 0, ccasToday: 0,
            usersCount: 0, usersToday: 0,
            reservationsCount: 0, reservationsToday: 0,
            recentPosts: [], recentUsers: []
        };

        // 1. Venues stats
        try {
            const venuesRes = await env.DB.prepare("SELECT COUNT(*) as count FROM venues").first();
            const pendingVenuesRes = await env.DB.prepare("SELECT COUNT(*) as count FROM venues WHERE created_at LIKE ?").bind(`${todayStr}%`).first();
            stats.venuesCount = venuesRes?.count || 0;
            stats.venuesToday = pendingVenuesRes?.count || 0;
        } catch (e: any) {
            console.error("Super Dashboard Venues Error:", e.message);
        }

        // 2. CCAs stats
        try {
            const ccasRes = await env.DB.prepare("SELECT COUNT(*) as count FROM ccas WHERE COALESCE(status, 'active') != 'DELETED'").first();
            const pendingCcasRes = await env.DB.prepare("SELECT COUNT(*) as count FROM ccas WHERE COALESCE(status, 'active') != 'DELETED' AND created_at LIKE ?").bind(`${todayStr}%`).first();
            stats.ccasCount = ccasRes?.count || 0;
            stats.ccasToday = pendingCcasRes?.count || 0;
        } catch (e: any) {
            console.error("Super Dashboard CCAs Error:", e.message);
        }

        // 3. CCAs Active users/signups
        try {
            const usersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE COALESCE(status, 'active') != 'DELETED'").first();
            // Since we don't have last_login logic reliably set in all places, we will query today's signups
            const activeUsersRes = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE COALESCE(status, 'active') != 'DELETED' AND created_at LIKE ?").bind(`${todayStr}%`).first();
            stats.usersCount = usersRes?.count || 0;
            stats.usersToday = activeUsersRes?.count || 0;
        } catch (e: any) {
            console.error("Super Dashboard Users Error:", e.message);
        }

        // 4. Reservations / Booking Activity
        try {
            const reservationsRes = await env.DB.prepare("SELECT COUNT(*) as count FROM reservations").first();
            const todayReservationsRes = await env.DB.prepare("SELECT COUNT(*) as count FROM reservations WHERE created_at LIKE ?").bind(`${todayStr}%`).first();
            stats.reservationsCount = reservationsRes?.count || 0;
            stats.reservationsToday = todayReservationsRes?.count || 0;
        } catch (e: any) {
            console.error("Super Dashboard Reservations Error:", e.message);
        }

        // 5. Recent Posts (max 6)
        try {
            const { results: recentPosts } = await env.DB.prepare(
                "SELECT id, board, title, created_at, views, likes FROM posts ORDER BY created_at DESC LIMIT 6"
            ).all();
            stats.recentPosts = recentPosts || [];
        } catch (e: any) {
            console.error("Super Dashboard Recent Posts Error:", e.message);
        }

        // 6. System Health / recent signups (max 5)
        try {
            const { results: recentUsers } = await env.DB.prepare(
                "SELECT nickname as name, created_at FROM users WHERE COALESCE(status, 'active') != 'DELETED' ORDER BY created_at DESC LIMIT 5"
            ).all();
            stats.recentUsers = recentUsers || [];
        } catch (e: any) {
            console.error("Super Dashboard Recent Users Error:", e.message);
        }

        return new Response(JSON.stringify({
            ...stats,
            status: 'success'
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Super Dashboard API Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
