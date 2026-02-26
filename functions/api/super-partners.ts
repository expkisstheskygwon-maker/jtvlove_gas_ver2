
interface Env {
    DB: any;
}

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");

    if (request.method === "GET") {
        try {
            if (action === "listVenues") {
                const today = new Date().toISOString().split('T')[0];
                const query = `
          SELECT v.*, 
          (SELECT COUNT(*) FROM reservations r WHERE r.venue_id = v.id AND r.reservation_date = ?) as today_reservations,
          (SELECT COUNT(*) FROM ccas c WHERE c.venue_id = v.id AND c.status = 'active') as cca_count
          FROM venues v
        `;
                const { results } = await env.DB.prepare(query).bind(today).all();
                return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
            }

            if (action === "listCCAs") {
                const today = new Date().toISOString().split('T')[0];
                const query = `
          SELECT c.*, v.name as venue_name,
          (SELECT COUNT(*) FROM reservations r WHERE r.cca_id = c.id AND r.reservation_date = ?) as today_reservations
          FROM ccas c
          LEFT JOIN venues v ON c.venue_id = v.id
        `;
                const { results } = await env.DB.prepare(query).bind(today).all();
                return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
            }

            if (action === "venueHistory" && id) {
                const ccasQuery = `
          SELECT eh.*, c.nickname, c.name as cca_name, c.image
          FROM cca_employment_history eh
          JOIN ccas c ON eh.cca_id = c.id
          WHERE eh.venue_id = ?
          ORDER BY eh.join_date DESC
        `;
                const ccas = (await env.DB.prepare(ccasQuery).bind(id).all()).results || [];

                const resQuery = `
          SELECT reservation_date, COUNT(*) as count
          FROM reservations
          WHERE venue_id = ?
          GROUP BY reservation_date
          ORDER BY reservation_date ASC
          LIMIT 30
        `;
                const stats = (await env.DB.prepare(resQuery).bind(id).all()).results || [];

                return new Response(JSON.stringify({ ccas, stats }), { headers: { "Content-Type": "application/json" } });
            }

            if (action === "ccaHistory" && id) {
                const venuesQuery = `
          SELECT eh.*, v.name as venue_name
          FROM cca_employment_history eh
          JOIN venues v ON eh.venue_id = v.id
          WHERE eh.cca_id = ?
          ORDER BY eh.join_date DESC
        `;
                const venues = (await env.DB.prepare(venuesQuery).bind(id).all()).results || [];

                const resQuery = `
          SELECT reservation_date, COUNT(*) as count
          FROM reservations
          WHERE cca_id = ?
          GROUP BY reservation_date
          ORDER BY reservation_date ASC
          LIMIT 30
        `;
                const resStats = (await env.DB.prepare(resQuery).bind(id).all()).results || [];

                const pointsQuery = `
          SELECT log_date, SUM(total) as points
          FROM cca_point_logs
          WHERE cca_id = ?
          GROUP BY SUBSTR(log_date, 1, 10)
          ORDER BY log_date ASC
          LIMIT 30
        `;
                const pointStats = (await env.DB.prepare(pointsQuery).bind(id).all()).results || [];

                return new Response(JSON.stringify({ venues, resStats, pointStats }), { headers: { "Content-Type": "application/json" } });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: "Action not found or invalid method" }), { status: 404 });
};
