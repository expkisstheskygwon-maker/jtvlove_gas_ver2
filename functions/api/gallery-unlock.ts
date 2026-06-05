// functions/api/gallery-unlock.ts
type D1Database = any;
interface Env { DB: D1Database; }

export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    // Auto-create user_unlocked_contents table defensively (Cloudflare D1 safety)
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS user_unlocked_contents (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                content_type TEXT NOT NULL,
                content_id TEXT NOT NULL,
                points_paid INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, content_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `).run();
    } catch (e: any) {
        console.error("D1 initialization check error in gallery-unlock.ts:", e);
    }

    // GET: Retrieve list of unlocked gallery item IDs for a user
    if (request.method === "GET") {
        const userId = url.searchParams.get("userId");
        if (!userId) {
            return new Response("userId is required", { status: 400 });
        }

        try {
            const { results } = await env.DB.prepare(
                "SELECT content_id FROM user_unlocked_contents WHERE user_id = ? AND content_type = 'gallery'"
            ).bind(userId).all();

            const ids = results ? results.map((r: any) => r.content_id) : [];
            return new Response(JSON.stringify({ unlockedIds: ids }), { headers });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // POST: Unlock a paid gallery item
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { userId, galleryId, price } = body;

            // 1. Validation
            if (!userId || !galleryId || price === undefined) {
                return new Response(JSON.stringify({ error: "userId, galleryId, and price are required" }), { status: 400, headers });
            }

            const priceNum = parseInt(price, 10);
            if (isNaN(priceNum) || priceNum < 0) {
                return new Response(JSON.stringify({ error: "올바른 가격을 지정해 주세요." }), { status: 400, headers });
            }

            // 2. Pre-check existence in DB
            const user = await env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first();
            if (!user) {
                return new Response(JSON.stringify({ error: "존재하지 않는 유저입니다." }), { status: 404, headers });
            }

            const galleryItem = await env.DB.prepare("SELECT cca_id FROM gallery WHERE id = ?").bind(galleryId).first();
            if (!galleryItem) {
                return new Response(JSON.stringify({ error: "존재하지 않는 미디어 항목입니다." }), { status: 404, headers });
            }
            const ccaId = galleryItem.cca_id;

            // 3. Pre-check already purchased
            const existing = await env.DB.prepare(
                "SELECT 1 FROM user_unlocked_contents WHERE user_id = ? AND content_id = ?"
            ).bind(userId, galleryId).first();
            if (existing) {
                return new Response(JSON.stringify({ error: "이미 구매한 콘텐츠입니다." }), { status: 400, headers });
            }

            // 4. Build Transaction Batch
            const unlockId = `ulc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const logId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const ccaLogId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            const batch = [
                // A. Acquire pessimistic lock on the user's row
                env.DB.prepare("UPDATE users SET points = points WHERE id = ?").bind(userId),

                // B. Insert into user_unlocked_contents (triggers UNIQUE constraint violation if concurrent buy happens)
                env.DB.prepare(`
                    INSERT INTO user_unlocked_contents (id, user_id, content_type, content_id, points_paid)
                    VALUES (?, ?, 'gallery', ?, ?)
                `).bind(unlockId, userId, galleryId, priceNum),

                // C. Enforce point limit (conditional insert of NULL into NOT NULL user_id column)
                env.DB.prepare(`
                    INSERT INTO user_point_logs (id, user_id, amount, type, description)
                    SELECT
                        ?,
                        CASE WHEN (SELECT points FROM users WHERE id = ?) < ? THEN NULL ELSE ? END,
                        ?,
                        'use',
                        ?
                `).bind(logId, userId, priceNum, userId, -priceNum, `콘텐츠 구매 해제: ${galleryId}`),

                // D. Deduct points from user
                env.DB.prepare("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?").bind(priceNum, userId, priceNum),

                // E. Credit points to CCA (creator)
                env.DB.prepare("UPDATE ccas SET points = points + ? WHERE id = ?").bind(priceNum, ccaId),

                // F. Log CCA points
                env.DB.prepare(`
                    INSERT INTO cca_point_logs (id, cca_id, name, amount, quantity, total, description, log_date)
                    VALUES (?, ?, '콘텐츠 판매', ?, 1, ?, ?, datetime('now'))
                `).bind(ccaLogId, ccaId, priceNum, priceNum, `미디어(${galleryId}) 판매 수익`)
            ];

            // 5. Execute transaction
            try {
                await env.DB.batch(batch);
            } catch (dbErr: any) {
                const errMsg = dbErr.message || '';
                
                // Catch Already Purchased (Double click race condition)
                if (errMsg.includes("UNIQUE constraint failed") && errMsg.includes("user_unlocked_contents")) {
                    return new Response(JSON.stringify({
                        error: "이미 구매한 콘텐츠입니다.",
                        code: "ALREADY_PURCHASED"
                    }), { status: 400, headers });
                }

                // Catch Insufficient Points
                if (errMsg.includes("NOT NULL constraint failed") && errMsg.includes("user_point_logs.user_id")) {
                    return new Response(JSON.stringify({
                        error: "포인트가 부족합니다.",
                        code: "INSUFFICIENT_POINTS",
                        required: priceNum,
                        current: user.points
                    }), { status: 402, headers });
                }

                throw dbErr; // Propagate general errors
            }

            // Notify Creator
            try {
                const senderName = user.nickname || '누군가';
                const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                await env.DB.prepare(`
                    INSERT INTO user_notifications (id, user_id, type, sender_name, title, content)
                    VALUES (?, ?, 'system', ?, '🔓 콘텐츠 해제', ?)
                `).bind(
                    notifId,
                    ccaId,
                    senderName,
                    `${senderName}님이 회원님의 유료 미디어를 해제했습니다.`
                ).run();
            } catch (notiErr) {
                console.error("Failed to create unlock notification:", notiErr);
            }

            // Get updated user points to return to frontend
            const updatedUser = await env.DB.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first();

            return new Response(JSON.stringify({
                success: true,
                remainingPoints: updatedUser?.points || 0,
                message: "콘텐츠가 해제되었습니다!"
            }), { headers });

        } catch (error: any) {
            console.error("Unlock processing error:", error);
            return new Response(JSON.stringify({ error: error.message || "서버 에러가 발생했습니다." }), { status: 500, headers });
        }
    }

    return new Response("Method not allowed", { status: 405 });
};
