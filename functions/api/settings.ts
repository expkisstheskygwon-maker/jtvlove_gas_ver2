
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

      // UPSERT logic: Insert if not exists, update if exists
      await env.DB.prepare(`
        INSERT INTO site_settings (id, site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url, updated_at)
        VALUES ('global', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          site_name = excluded.site_name,
          admin_phone = excluded.admin_phone,
          admin_email = excluded.admin_email,
          admin_sns = excluded.admin_sns,
          hq_address = excluded.hq_address,
          logo_url = excluded.logo_url,
          favicon_url = excluded.favicon_url,
          updated_at = CURRENT_TIMESTAMP
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
