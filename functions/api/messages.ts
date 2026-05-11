// functions/api/messages.ts - 통합 메시지(쪽지) API
interface Env { DB: any; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);

    // Ensure table exists
    try {
        await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        sender_name TEXT,
        receiver_id TEXT NOT NULL,
        receiver_type TEXT NOT NULL,
        receiver_name TEXT,
        subject TEXT,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        replied INTEGER DEFAULT 0,
        reply_text TEXT,
        replied_at TEXT,
        parent_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    } catch (e) { /* table already exists */ }

    // GET: 메시지 목록 조회
    if (request.method === "GET") {
        const receiverId = url.searchParams.get("receiverId");
        const receiverType = url.searchParams.get("receiverType");
        const senderId = url.searchParams.get("senderId");
        const senderType = url.searchParams.get("senderType");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        try {
            let query: string;
            let params: any[];

            if (receiverId && receiverType) {
                query = `SELECT * FROM messages WHERE receiver_id = ? AND receiver_type = ? ORDER BY created_at DESC LIMIT ?`;
                params = [receiverId, receiverType, limit];
            } else if (senderId && senderType) {
                query = `SELECT * FROM messages WHERE sender_id = ? AND sender_type = ? ORDER BY created_at DESC LIMIT ?`;
                params = [senderId, senderType, limit];
            } else {
                return new Response(JSON.stringify({ error: "receiverId+receiverType or senderId+senderType required" }), {
                    status: 400, headers: { "Content-Type": "application/json" },
                });
            }

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results || []), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { "Content-Type": "application/json" },
            });
        }
    }

    // POST: 새 메시지 발송
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { sender_id, sender_type, sender_name, receiver_id, receiver_type, receiver_name, subject, content, parent_id } = body;

            if (!sender_id || !sender_type || !receiver_id || !receiver_type || !content) {
                return new Response(JSON.stringify({ error: "sender_id, sender_type, receiver_id, receiver_type, content are required" }), {
                    status: 400, headers: { "Content-Type": "application/json" },
                });
            }

            const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await env.DB.prepare(
                `INSERT INTO messages (id, sender_id, sender_type, sender_name, receiver_id, receiver_type, receiver_name, subject, content, parent_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(id, sender_id, sender_type, sender_name || '', receiver_id, receiver_type, receiver_name || '', subject || '', content, parent_id || null).run();

            // Notify receiver (if it's a user)
            if (receiver_type === 'user') {
                const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await env.DB.prepare(`
                    INSERT INTO user_notifications (id, user_id, type, sender_name, title, content)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).bind(
                    notifId, 
                    receiver_id, 
                    'private', 
                    sender_name || '사용자', 
                    '새 메시지', 
                    `${sender_name || '누군가'}님이 메시지를 보냈습니다.`
                ).run();
            }

            return new Response(JSON.stringify({ success: true, id }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { "Content-Type": "application/json" },
            });
        }
    }

    // PATCH: 읽음 처리 / 답장
    if (request.method === "PATCH") {
        try {
            const body = await request.json();
            const { id, is_read, reply_text } = body;

            if (!id) {
                return new Response(JSON.stringify({ error: "id is required" }), {
                    status: 400, headers: { "Content-Type": "application/json" },
                });
            }

            const updates: string[] = [];
            const params: any[] = [];

            if (is_read !== undefined) {
                updates.push("is_read = ?");
                params.push(is_read ? 1 : 0);
            }
            if (reply_text !== undefined) {
                updates.push("replied = 1");
                updates.push("reply_text = ?");
                params.push(reply_text);
                updates.push("replied_at = ?");
                params.push(new Date().toISOString());
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: "No fields to update" }), {
                    status: 400, headers: { "Content-Type": "application/json" },
                });
            }

            const query = `UPDATE messages SET ${updates.join(", ")} WHERE id = ?`;
            params.push(id);
            await env.DB.prepare(query).bind(...params).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { "Content-Type": "application/json" },
            });
        }
    }

    // DELETE: 메시지 삭제
    if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) {
            return new Response(JSON.stringify({ error: "id is required" }), {
                status: 400, headers: { "Content-Type": "application/json" },
            });
        }

        try {
            await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { "Content-Type": "application/json" },
            });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
