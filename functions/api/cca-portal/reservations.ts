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
                venueId, ccaId, ccaIds, customer_name, customer_contact, reservation_date, reservation_time, customer_note, group_size, table_id, room_id, status
            } = body;

            if (!venueId || !customer_name || !reservation_date || !reservation_time) {
                return new Response(JSON.stringify({ error: "Required fields missing" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const id = body.id || `res_${Date.now()}`;
            await env.DB.prepare(`
                INSERT INTO reservations (
                    id, venue_id, cca_id, cca_ids, customer_name, customer_contact, reservation_date, reservation_time, customer_note, group_size, table_id, room_id, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id,
                venueId,
                ccaId || (ccaIds && ccaIds[0]) || '',
                JSON.stringify(ccaIds || []),
                customer_name,
                customer_contact || '',
                reservation_date,
                reservation_time,
                customer_note || '',
                group_size || 1,
                table_id || '',
                room_id || '',
                status || 'confirmed',
                new Date().toISOString()
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

    // PATCH: 예약 정보 업데이트 (상태, 배정 등 전체 업데이트 지원)
    if (request.method === "PATCH") {
        try {
            const body = await request.json() as any;
            const { id } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: "id is required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // 필드별 동적 업데이트 (간소화된 방식)
            const updates = [];
            const params = [];

            const fields = [
                'status', 'customer_name', 'customer_contact', 'customer_note',
                'group_size', 'table_id', 'room_id', 'reservation_date', 'reservation_time'
            ];

            for (const field of fields) {
                if (body[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    params.push(body[field]);
                }
            }

            if (body.ccaIds !== undefined) {
                updates.push(`cca_ids = ?`);
                params.push(JSON.stringify(body.ccaIds));
                updates.push(`cca_id = ?`);
                params.push(body.ccaIds[0] || '');
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: "No fields to update" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            params.push(id);
            const query = `UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`;

            await env.DB.prepare(query).bind(...params).run();

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
