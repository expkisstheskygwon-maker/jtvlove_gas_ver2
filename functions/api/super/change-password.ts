// functions/api/super/change-password.ts

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
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return new Response(JSON.stringify({ error: 'Valid current and new (min 6 chars) passwords required' }), { status: 400 });
        }

        // Verify current super admin password
        const superAdmin = await env.DB.prepare("SELECT id FROM users WHERE role = 'super_admin' AND password = ?").bind(currentPassword).first();

        if (!superAdmin) {
            return new Response(JSON.stringify({ error: 'Incorrect current password' }), { status: 401 });
        }

        // Update to new password
        await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?").bind(newPassword, superAdmin.id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
