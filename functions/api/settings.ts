
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  
  if (request.method === "GET") {
    try {
      const result = await env.DB.prepare(
        "SELECT * FROM site_settings WHERE id = 'global'"
      ).first();
      
      return new Response(JSON.stringify(result || {}), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url } = body;

      await env.DB.prepare(`
        UPDATE site_settings 
        SET site_name = ?, admin_phone = ?, admin_email = ?, admin_sns = ?, hq_address = ?, logo_url = ?, favicon_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 'global'
      `).bind(
        site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url
      ).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
