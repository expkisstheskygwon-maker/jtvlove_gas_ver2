
export async function onRequest(context: any) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET') {
        const { results } = await env.DB.prepare(
            "SELECT * FROM board_configs ORDER BY display_order ASC"
        ).all();

        // Parse categories JSON
        const boards = results.map((b: any) => ({
            ...b,
            categories: b.categories ? JSON.parse(b.categories) : []
        }));

        return new Response(JSON.stringify(boards), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (method === 'POST') {
        const data = await request.json();
        const { id, name, categories, display_order } = data;

        await env.DB.prepare(
            "INSERT OR REPLACE INTO board_configs (id, name, categories, display_order) VALUES (?, ?, ?, ?)"
        )
            .bind(id, name, JSON.stringify(categories || []), display_order || 0)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (!id) return new Response("ID required", { status: 400 });

        await env.DB.prepare("DELETE FROM board_configs WHERE id = ?").bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response("Method not allowed", { status: 405 });
}
