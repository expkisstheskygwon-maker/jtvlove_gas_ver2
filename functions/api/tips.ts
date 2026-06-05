// functions/api/tips.ts
type D1Database = any;
interface Env { DB: D1Database; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const headers = { "Content-Type": "application/json" };

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const body = await request.json();
        const { userId, ccaId, amount, description } = body;

        // 1. Validation
        if (!userId || !ccaId || !amount) {
            return new Response(JSON.stringify({ error: "userId, ccaId, and amount are required" }), { status: 400, headers });
        }

        const amountNum = parseInt(amount, 10);
        if (isNaN(amountNum) || amountNum <= 0) {
            return new Response(JSON.stringify({ error: "올바른 팁 금액을 입력해 주세요." }), { status: 400, headers });
        }

        // 2. Pre-check existence in DB
        const user = await env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first();
        if (!user) {
            return new Response(JSON.stringify({ error: "존재하지 않는 유저입니다." }), { status: 404, headers });
        }

        const cca = await env.DB.prepare("SELECT name, nickname FROM ccas WHERE id = ?").bind(ccaId).first();
        if (!cca) {
            return new Response(JSON.stringify({ error: "존재하지 않는 크리에이터입니다." }), { status: 404, headers });
        }

        // 3. Build Transaction Batch
        const logId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const ccaLogId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const ccaName = cca.nickname || cca.name;

        const batch = [
            // A. Acquire pessimistic lock on the user's row (write lock)
            env.DB.prepare("UPDATE users SET points = points WHERE id = ?").bind(userId),

            // B. Enforce point limit (conditional insert of NULL into NOT NULL user_id column)
            env.DB.prepare(`
                INSERT INTO user_point_logs (id, user_id, amount, type, description)
                SELECT
                    ?,
                    CASE WHEN (SELECT points FROM users WHERE id = ?) < ? THEN NULL ELSE ? END,
                    ?,
                    'use',
                    ?
            `).bind(logId, userId, amountNum, userId, -amountNum, description || `${ccaName}님에게 팁 전송`),

            // C. Deduct points from user
            env.DB.prepare("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?").bind(amountNum, userId, amountNum),

            // D. Credit points to CCA
            env.DB.prepare("UPDATE ccas SET points = points + ? WHERE id = ?").bind(amountNum, ccaId),

            // E. Create CCA Earning Log
            env.DB.prepare(`
                INSERT INTO cca_point_logs (id, cca_id, name, amount, quantity, total, description, log_date)
                VALUES (?, ?, '팁 수익', ?, 1, ?, ?, datetime('now'))
            `).bind(ccaLogId, ccaId, amountNum, amountNum, `팬(${userId})으로부터 팁`)
        ];

        // 4. Execute transaction
        try {
            await env.DB.batch(batch);
        } catch (dbErr: any) {
            const errMsg = dbErr.message || '';
            if (errMsg.includes("NOT NULL constraint failed") && errMsg.includes("user_point_logs.user_id")) {
                return new Response(JSON.stringify({
                    error: "포인트가 부족합니다.",
                    code: "INSUFFICIENT_POINTS",
                    required: amountNum,
                    current: user.points
                }), { status: 402, headers });
            }
            throw dbErr; // Let outer catch block handle general DB errors
        }

        // 5. Notify Creator
        try {
            const senderName = user.nickname || '누군가';
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await env.DB.prepare(`
                INSERT INTO user_notifications (id, user_id, type, sender_name, title, content)
                VALUES (?, ?, 'system', ?, '💰 팁 도착', ?)
            `).bind(
                notifId,
                ccaId,
                senderName,
                `${senderName}님이 회원님에게 ${amountNum}P의 팁을 선물했습니다.`
            ).run();
        } catch (notiErr) {
            console.error("Failed to create tip notification:", notiErr);
        }

        // Get updated user points to return to frontend
        const updatedUser = await env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first();

        return new Response(JSON.stringify({
            success: true,
            remainingPoints: updatedUser?.points || 0,
            message: `${ccaName}님에게 팁을 보냈습니다.`
        }), { headers });

    } catch (error: any) {
        console.error("Tip processing error:", error);
        return new Response(JSON.stringify({ error: error.message || "서버 에러가 발생했습니다." }), { status: 500, headers });
    }
};
