// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    // GET: 고객 메시지 목록 조회
    if (request.method === "GET") {
        const ccaId = url.searchParams.get("ccaId");

        if (!ccaId) {
            return new Response(JSON.stringify({ error: "ccaId is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        try {
            const { results } = await env.DB.prepare(
                "SELECT * FROM customer_messages WHERE cca_id = ? ORDER BY created_at DESC"
            ).bind(ccaId).all();

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

    // PATCH: 메시지 상태 변경 (읽음 표시, 답변 완료 등)
    if (request.method === "PATCH") {
        try {
            const body = await request.json() as any;
            const { id, is_read, replied, reply_text } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: "id is required" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            let query = "UPDATE customer_messages SET ";
            const updates = [];
            const params = [];

            if (is_read !== undefined) {
                updates.push("is_read = ?");
                params.push(is_read ? 1 : 0);
            }
            if (replied !== undefined) {
                updates.push("replied = ?");
                params.push(replied ? 1 : 0);
                if (replied) {
                    updates.push("replied_at = ?");
                    params.push(new Date().toISOString());
                }
            }
            if (body.reply_text !== undefined) {
                updates.push("reply_text = ?");
                params.push(body.reply_text);
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: "No fields to update" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            query += updates.join(", ") + " WHERE id = ?";
            params.push(id);

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
