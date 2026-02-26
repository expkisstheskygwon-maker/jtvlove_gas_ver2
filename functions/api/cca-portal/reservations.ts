// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    // GET: 예약 목록 조회
    if (request.method === "GET") {
        const ccaId = url.searchParams.get("ccaId");
        const month = url.searchParams.get("month"); // YYYY-MM 형식 (선택 사항)

        if (!ccaId) {
            return new Response(JSON.stringify({ error: "ccaId is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        try {
            let query = "SELECT * FROM reservations WHERE cca_id = ?";
            const params = [ccaId];

            if (month) {
                query += " AND reservation_date LIKE ?";
                params.push(`${month}%`);
            }

            query += " ORDER BY reservation_date DESC, reservation_time ASC";

            const { results } = await env.DB.prepare(query).bind(...params).all();

            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    // POST: 신규 예약 등록 (수동 등록)
    if (request.method === "POST") {
        try {
            const body = await request.json() as any;
            const {
                venueId, ccaId, customer_name, reservation_date, reservation_time, customer_note, group_size
            } = body;

            if (!venueId || !ccaId || !customer_name || !reservation_date || !reservation_time) {
                return new Response(JSON.stringify({ error: "Required fields missing" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const id = `res_${Date.now()}`;
            await env.DB.prepare(`
                INSERT INTO reservations (
                    id, venue_id, cca_id, customer_name, reservation_date, reservation_time, customer_note, group_size, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
            `).bind(
                id, venueId, ccaId, customer_name, reservation_date, reservation_time, customer_note || '', group_size || 1, new Date().toISOString()
            ).run();

            return new Response(JSON.stringify({ success: true, id }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    // PATCH: 예약 상태 변경 (확정, 취소, 노쇼 등)
    if (request.method === "PATCH") {
        try {
            const { id, status } = await request.json() as any;

            if (!id || !status) {
                return new Response(JSON.stringify({ error: "id and status are required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await env.DB.prepare(
                "UPDATE reservations SET status = ? WHERE id = ?"
            ).bind(status, id).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
