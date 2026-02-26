
export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const venueId = url.searchParams.get('venueId') || 'v1';

    if (request.method === 'GET') {
        const { results } = await env.DB.prepare(
            "SELECT * FROM cca_point_categories WHERE venue_id = ? ORDER BY type ASC, name ASC"
        ).bind(venueId).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (request.method === 'POST') {
        const { id, name, amount, type } = await request.json();
        const finalId = id || `pc_${Date.now()}`;

        await env.DB.prepare(`
      INSERT INTO cca_point_categories (id, venue_id, name, amount, type)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        amount = excluded.amount,
        type = excluded.type
    `).bind(finalId, venueId, name, amount, type).run();

        return new Response(JSON.stringify({ success: true, id: finalId }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (request.method === 'DELETE') {
        const { id } = await request.json();
        await env.DB.prepare("DELETE FROM cca_point_categories WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response("Method not allowed", { status: 405 });
};
