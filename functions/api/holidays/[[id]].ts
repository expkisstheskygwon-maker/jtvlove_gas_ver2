
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request, params } = context;
  const url = new URL(request.url);
  
  const rawId = params.id; // This would be the holiday ID if deleting specific one, but we usually sync by CCA
  const ccaId = url.searchParams.get('ccaId');

  // GET: List holidays for a CCA
  if (request.method === 'GET') {
    if (!ccaId) return new Response(JSON.stringify({ error: 'ccaId required' }), { status: 400 });
    try {
      const { results } = await env.DB.prepare("SELECT holiday_date FROM cca_holidays WHERE cca_id = ?").bind(ccaId).all();
      return new Response(JSON.stringify(results.map((r: any) => r.holiday_date)), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // POST: Sync holidays (Replace all for a CCA)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { ccaId: bodyCcaId, dates } = body; // dates is string[]
      
      if (!bodyCcaId || !Array.isArray(dates)) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }

      // Transaction-like behavior: Delete all and insert new
      // D1 doesn't support full transactions in a single prepare, but we can use batch
      const statements = [
        env.DB.prepare("DELETE FROM cca_holidays WHERE cca_id = ?").bind(bodyCcaId)
      ];
      
      for (const date of dates) {
        statements.push(
          env.DB.prepare("INSERT INTO cca_holidays (id, cca_id, holiday_date) VALUES (?, ?, ?)")
            .bind(crypto.randomUUID(), bodyCcaId, date)
        );
      }
      
      await env.DB.batch(statements);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
