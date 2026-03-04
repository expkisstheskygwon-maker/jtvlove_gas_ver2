
type D1Database = any;
type PagesFunction<Env> = any;

interface Env {
    DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
    const { env, request } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { email, password, ccaId, isSuperAdmin } = await request.json();

        if (!password) {
            return new Response(JSON.stringify({ error: 'Password required' }), { status: 400 });
        }

        // Handle Super Admin Login (Password Only)
        if (isSuperAdmin) {
            const superAdmin = await env.DB.prepare("SELECT id, email, nickname, role, real_name, level, total_xp, points, profile_image FROM users WHERE role = 'super_admin' AND password = ?").bind(password).first();

            if (!superAdmin) {
                return new Response(JSON.stringify({ error: 'Invalid super admin password' }), { status: 401 });
            }

            return new Response(JSON.stringify({ success: true, user: superAdmin, venueId: null }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Handle CCA Login
        if (ccaId) {
            const cca = await env.DB.prepare('SELECT id, name, nickname, venue_id, image, grade FROM ccas WHERE id = ? AND password = ?').bind(ccaId, password).first();

            if (!cca) {
                return new Response(JSON.stringify({ error: 'Invalid password or CCA not found' }), { status: 401 });
            }

            // Return a CCA object mocked as a user profile
            const user = {
                id: cca.id,
                email: cca.id + '@cca.local', // Dummy email for frontend compat
                nickname: cca.nickname || cca.name,
                role: 'cca',
                real_name: cca.name,
                profile_image: cca.image,
                level: 1,
                total_xp: 0,
                points: 0
            };

            return new Response(JSON.stringify({ success: true, user, ccaId: cca.id, venueId: cca.venue_id }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Standard User / Admin Login
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
        }

        // In a real application, password should be hashed and verified!
        const user = await env.DB.prepare('SELECT id, email, nickname, role, real_name, level, total_xp, points, profile_image FROM users WHERE email = ? AND password = ?').bind(email, password).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
        }

        let venueId = null;
        if (user.role === 'venue_admin') {
            const venue = await env.DB.prepare('SELECT id FROM venues WHERE owner_id = ?').bind(user.id).first();
            if (venue) venueId = venue.id;
        }

        return new Response(JSON.stringify({ success: true, user, venueId }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
