
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
            // 1. Ensure essential tables exist (D1 initialization safety)
            try {
                await env.DB.prepare(`
                    CREATE TABLE IF NOT EXISTS venues (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        region TEXT NOT NULL,
                        rating REAL DEFAULT 0,
                        reviews_count INTEGER DEFAULT 0,
                        description TEXT,
                        image TEXT,
                        banner_image TEXT,
                        phone TEXT,
                        address TEXT,
                        introduction TEXT,
                        tags TEXT,
                        features TEXT,
                        sns TEXT,
                        operating_hours TEXT,
                        showUpTime TEXT,
                        media TEXT,
                        menu TEXT,
                        tables TEXT,
                        rooms TEXT,
                        owner_id TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `).run();

                await env.DB.prepare(`
                    CREATE TABLE IF NOT EXISTS reservations (
                        id TEXT PRIMARY KEY,
                        venue_id TEXT,
                        cca_id TEXT,
                        cca_ids TEXT,
                        customer_name TEXT NOT NULL,
                        customer_contact TEXT,
                        reservation_time TEXT,
                        reservation_date TEXT,
                        customer_note TEXT,
                        group_size INTEGER DEFAULT 1,
                        table_id TEXT,
                        room_id TEXT,
                        status TEXT DEFAULT 'pending',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `).run();

                await env.DB.prepare(`
                    CREATE TABLE IF NOT EXISTS ccas (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        nickname TEXT,
                        real_name_first TEXT,
                        real_name_middle TEXT,
                        real_name_last TEXT,
                        birthday TEXT,
                        address TEXT,
                        phone TEXT,
                        venue_id TEXT NOT NULL,
                        rating REAL DEFAULT 0,
                        image TEXT,
                        experience TEXT,
                        languages TEXT,
                        height TEXT,
                        description TEXT,
                        status TEXT DEFAULT 'active',
                        grade TEXT DEFAULT 'PRO',
                        points INTEGER DEFAULT 0,
                        mbti TEXT,
                        zodiac TEXT,
                        one_line_story TEXT,
                        sns_links TEXT,
                        experience_history TEXT,
                        marital_status TEXT,
                        children_status TEXT,
                        special_notes TEXT,
                        views_count INTEGER DEFAULT 0,
                        likes_count INTEGER DEFAULT 0,
                        posts_count INTEGER DEFAULT 0,
                        is_new INTEGER DEFAULT 0,
                        weight TEXT,
                        drinking TEXT,
                        smoking TEXT,
                        pets TEXT,
                        specialties TEXT,
                        password TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `).run();
            } catch (e) {
                console.error("D1 table creation error:", e);
            }

            if (action === "listVenues") {
                const today = new Date().toISOString().split('T')[0];
                const query = `
          SELECT v.*, u.email as admin_email,
          (SELECT COUNT(*) FROM reservations r WHERE r.venue_id = v.id AND r.reservation_date = ?) as today_reservations,
          (SELECT COUNT(*) FROM ccas c WHERE c.venue_id = v.id AND c.status = 'active') as cca_count
          FROM venues v
          LEFT JOIN users u ON v.owner_id = u.id
        `;
                const { results } = await env.DB.prepare(query).bind(today).all();
                return new Response(JSON.stringify(results || []), { headers: { "Content-Type": "application/json" } });
            }

            if (action === 'listCCAs') {
                const today = new Date().toISOString().split('T')[0];
                const query = `
          SELECT c.*, v.name as venue_name, v.name as venueName, v.region as region,
          (SELECT COUNT(*) FROM reservations r WHERE r.cca_id = c.id AND r.reservation_date = ?) as today_reservations
          FROM ccas c 
          LEFT JOIN venues v ON c.venue_id = v.id
          ORDER BY c.created_at DESC
        `;
                let results: any[] = [];
                try {
                    const dbResult = await env.DB.prepare(query).bind(today).all();
                    results = dbResult.results || [];
                } catch (dbErr: any) {
                    console.error("DB Query Error in listCCAs:", dbErr);
                    // Fallback to query without created_at if created_at column is missing
                    if (dbErr.message && dbErr.message.includes("column")) {
                        const fallbackQuery = `
                            SELECT c.*, v.name as venue_name, v.name as venueName, v.region as region,
                            (SELECT COUNT(*) FROM reservations r WHERE r.cca_id = c.id AND r.reservation_date = ?) as today_reservations
                            FROM ccas c 
                            LEFT JOIN venues v ON c.venue_id = v.id
                        `;
                        const fbResult = await env.DB.prepare(fallbackQuery).bind(today).all();
                        results = fbResult.results || [];
                    } else {
                        throw dbErr;
                    }
                }

                const formatted = results.map((c: any) => {
                    let specialties = [];
                    let languages = [];
                    let experience_history = [];
                    try { if (c.specialties) specialties = typeof c.specialties === 'string' ? JSON.parse(c.specialties) : c.specialties; } catch(e) {}
                    try { if (c.languages) languages = typeof c.languages === 'string' ? JSON.parse(c.languages) : c.languages; } catch(e) {}
                    try { if (c.experience_history) experience_history = typeof c.experience_history === 'string' ? JSON.parse(c.experience_history) : c.experience_history; } catch(e) {}
                    
                    return {
                        ...c,
                        venueName: c.venueName || c.venue_name,
                        isNew: c.is_new === 1,
                        specialties,
                        languages,
                        experience_history
                    };
                });

                return new Response(JSON.stringify(formatted), {
                    headers: { "Content-Type": "application/json" },
                });
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

    if (request.method === "POST") {
        try {
            const body = await request.json() as any;
            const { action, venueId, newPassword } = body;

            if (action === "updateVenueAdminAccount") {
                const { venueId, newEmail, newPassword } = body;
                if (!venueId || !newEmail) {
                    return new Response(JSON.stringify({ error: "Venue ID and Email are required" }), { status: 400 });
                }

                // 1. Find if venue has an owner
                const venue = await env.DB.prepare("SELECT name, owner_id FROM venues WHERE id = ?").bind(venueId).first();
                if (!venue) {
                    return new Response(JSON.stringify({ error: "Venue not found" }), { status: 404 });
                }

                if (venue.owner_id) {
                    // 2. Update existing owner
                    const updates = ["email = ?"];
                    const params = [newEmail];
                    if (newPassword) {
                        updates.push("password = ?");
                        params.push(newPassword);
                    }
                    params.push(venue.owner_id);

                    await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
                        .bind(...params).run();
                } else {
                    // 3. Create new owner if none exists
                    const newUserId = `u_admin_${Date.now()}`;
                    const password = newPassword || "123456"; // Default password if not provided
                    
                    await env.DB.prepare(`
                        INSERT INTO users (id, email, password, nickname, real_name, role)
                        VALUES (?, ?, ?, ?, ?, 'venue_admin')
                    `).bind(newUserId, newEmail, password, `${venue.name} Admin`, venue.name).run();

                    // 4. Link venue to this new owner
                    await env.DB.prepare("UPDATE venues SET owner_id = ? WHERE id = ?")
                        .bind(newUserId, venueId).run();
                }

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            }

            if (action === "resetVenueAdminPassword") {
                if (!venueId || !newPassword) {
                    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
                }

                // Find owner_id from venue
                const venue = await env.DB.prepare("SELECT owner_id FROM venues WHERE id = ?").bind(venueId).first();
                if (!venue || !venue.owner_id) {
                    return new Response(JSON.stringify({ error: "Venue or owner not found" }), { status: 404 });
                }

                // Update users table for that owner
                await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(newPassword, venue.owner_id).run();

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: "Action not found or invalid method" }), { status: 404 });
};
