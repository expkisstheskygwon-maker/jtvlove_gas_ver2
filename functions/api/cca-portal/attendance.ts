// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { env, request } = context;

    // POST: 출근하기 / 퇴근하기
    if (request.method === "POST") {
        try {
            const { ccaId, venueId, action } = await request.json() as any;

            if (!ccaId || !venueId || !action) {
                return new Response(JSON.stringify({ error: "ccaId, venueId, action are required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const getBusinessDate = () => {
                const now = new Date();
                const utcHours = now.getUTCHours();
                const utcMinutes = now.getUTCMinutes();
                
                // 9:30 AM Local (UTC+9) = 00:30 AM UTC
                // 00:00 ~ 00:29 (UTC) == 09:00 ~ 09:29 (Local) -> Still yesterday's business day
                if (utcHours === 0 && utcMinutes < 30) {
                    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    return yesterday.toISOString().split('T')[0];
                }
                return now.toISOString().split('T')[0];
            };

            const today = getBusinessDate();
            const now = new Date().toISOString();

            if (action === "check_in") {
                const id = crypto.randomUUID();
                await env.DB.prepare(
                    "INSERT OR REPLACE INTO cca_attendance (id, cca_id, venue_id, check_in_at, attendance_date, status) VALUES (?, ?, ?, ?, ?, 'checked_in')"
                ).bind(id, ccaId, venueId, now, today).run();

                return new Response(JSON.stringify({ success: true, action: "check_in", time: now }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (action === "check_out") {
                // Find latest checked_in record for this CCA
                const lastCheckIn = await env.DB.prepare(
                    "SELECT id FROM cca_attendance WHERE cca_id = ? AND status = 'checked_in' ORDER BY check_in_at DESC LIMIT 1"
                ).bind(ccaId).first();

                if (lastCheckIn) {
                    await env.DB.prepare(
                        "UPDATE cca_attendance SET check_out_at = ?, status = 'checked_out' WHERE id = ?"
                    ).bind(now, lastCheckIn.id).run();
                } else {
                    // Fallback to legacy date-based update if no specific record found
                    await env.DB.prepare(
                        "UPDATE cca_attendance SET check_out_at = ?, status = 'checked_out' WHERE cca_id = ? AND attendance_date = ?"
                    ).bind(now, ccaId, today).run();
                }

                return new Response(JSON.stringify({ success: true, action: "check_out", time: now }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400,
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
