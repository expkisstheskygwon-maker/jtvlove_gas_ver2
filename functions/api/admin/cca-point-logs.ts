
export const onRequest: any = async (context: any) => {
    const { env, request } = context;
    const url = new URL(request.url);
    const ccaId = url.searchParams.get('ccaId');

    if (request.method === 'GET') {
        if (!ccaId) return new Response("ccaId is required", { status: 400 });
        const { results } = await env.DB.prepare(
            "SELECT * FROM cca_point_logs WHERE cca_id = ? ORDER BY log_date DESC, created_at DESC"
        ).bind(ccaId).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (request.method === 'POST') {
        const body = await request.json();
        const {
            ccaId, categoryId, name, amount, quantity, description, logDate
        } = body;

        const id = `pl_${Date.now()}`;
        const total = amount * (quantity || 1);

        await env.DB.prepare(`
      INSERT INTO cca_point_logs (
        id, cca_id, category_id, name, amount, quantity, total, description, log_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            id, ccaId, categoryId || null, name, amount, quantity || 1, total, description || '', logDate || new Date().toISOString()
        ).run();

        // Update the main points in ccas table as well (Optional but good for summary)
        // Here we decide to keep the summary updated
        const pointDelta = total * (body.type === 'penalty' ? -1 : 1);
        await env.DB.prepare("UPDATE ccas SET points = points + ? WHERE id = ?").bind(pointDelta, ccaId).run();

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (request.method === 'DELETE') {
        const { id, ccaId, total, type } = await request.json();
        await env.DB.prepare("DELETE FROM cca_point_logs WHERE id = ?").bind(id).run();

        // Reverse the points update
        const reverseDelta = total * (type === 'penalty' ? 1 : -1);
        await env.DB.prepare("UPDATE ccas SET points = points + ? WHERE id = ?").bind(reverseDelta, ccaId).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response("Method not allowed", { status: 405 });
};
