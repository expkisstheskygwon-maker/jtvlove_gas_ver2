
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
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
        }

        // In a real application, password should be hashed and verified!
        const user = await env.DB.prepare('SELECT id, email, nickname, role, real_name, level, total_xp, points FROM users WHERE email = ? AND password = ?').bind(email, password).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
        }

        return new Response(JSON.stringify({ success: true, user }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
