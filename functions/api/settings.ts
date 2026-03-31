
// Cloudflare worker types
type D1Database = any;
interface Env {
  DB: D1Database;
}

// GET: 설정 불러오기
export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' is missing in Cloudflare Dashboard." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Ensure table exists first
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id TEXT PRIMARY KEY,
          site_name TEXT,
          admin_phone TEXT,
          admin_email TEXT,
          admin_sns TEXT,
          hq_address TEXT,
          logo_url TEXT,
          favicon_url TEXT,
          venues_hero_image TEXT,
          venues_hero_title TEXT,
          venues_hero_subtitle TEXT,
          ui_texts TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) {
      // Ignore if exists or error
    }

    // 2. Add any newly introduced columns
    try {
      const { results: columns } = await env.DB.prepare("PRAGMA table_info(site_settings)").all();
      if (columns && columns.length > 0) {
        const existingCols = columns.map((c: any) => c.name);
        const columnsToAdd = [
          "venues_hero_image", "venues_hero_title", "venues_hero_subtitle",
          "ccas_hero_image", "ccas_hero_title", "ccas_hero_subtitle",
          "notice_hero_image", "notice_hero_title", "notice_hero_subtitle",
          "ui_texts", "hide_site_name", "marketing_live_ccas"
        ];
        
        for (const col of columnsToAdd) {
          if (!existingCols.includes(col)) {
            await env.DB.prepare(`ALTER TABLE site_settings ADD COLUMN ${col} TEXT`).run();
          }
        }
      }
    } catch (e) {
      // Ignore migration errors
    }

    const result = await env.DB.prepare(
      "SELECT * FROM site_settings WHERE id = 'global'"
    ).first();

    return new Response(JSON.stringify(result || {}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, details: "Check if 'site_settings' table exists." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST: 설정 저장하기 (UPSERT)
export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Ensure table exists first
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id TEXT PRIMARY KEY,
          site_name TEXT,
          admin_phone TEXT,
          admin_email TEXT,
          admin_sns TEXT,
          hq_address TEXT,
          logo_url TEXT,
          favicon_url TEXT,
          venues_hero_image TEXT,
          venues_hero_title TEXT,
          venues_hero_subtitle TEXT,
          ui_texts TEXT,
          hide_site_name TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (e) {
      // Ignore if exists or error
    }

    // 2. Add any newly introduced columns
    try {
      const { results: columns } = await env.DB.prepare("PRAGMA table_info(site_settings)").all();
      if (columns && columns.length > 0) {
        const existingCols = columns.map((c: any) => c.name);
        const columnsToAdd = [
          "venues_hero_image", "venues_hero_title", "venues_hero_subtitle",
          "ccas_hero_image", "ccas_hero_title", "ccas_hero_subtitle",
          "notice_hero_image", "notice_hero_title", "notice_hero_subtitle",
          "ui_texts", "hide_site_name", "marketing_live_ccas"
        ];
        
        for (const col of columnsToAdd) {
          if (!existingCols.includes(col)) {
            await env.DB.prepare(`ALTER TABLE site_settings ADD COLUMN ${col} TEXT`).run();
          }
        }
      }
    } catch (e) {
      // Ignore migration errors
    }

    const body = await request.json();
    const {
      site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url,
      venues_hero_image, venues_hero_title, venues_hero_subtitle,
      ccas_hero_image, ccas_hero_title, ccas_hero_subtitle,
      notice_hero_image, notice_hero_title, notice_hero_subtitle,
      ui_texts, hide_site_name, marketing_live_ccas
    } = body;

    // D1 (SQLite) UPSERT syntax
    await env.DB.prepare(`
      INSERT INTO site_settings (
        id, site_name, admin_phone, admin_email, admin_sns, hq_address, logo_url, favicon_url, 
        venues_hero_image, venues_hero_title, venues_hero_subtitle,
        ccas_hero_image, ccas_hero_title, ccas_hero_subtitle,
        notice_hero_image, notice_hero_title, notice_hero_subtitle,
        ui_texts, hide_site_name, marketing_live_ccas,
        updated_at
      )
      VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        site_name = excluded.site_name,
        admin_phone = excluded.admin_phone,
        admin_email = excluded.admin_email,
        admin_sns = excluded.admin_sns,
        hq_address = excluded.hq_address,
        logo_url = excluded.logo_url,
        favicon_url = excluded.favicon_url,
        venues_hero_image = excluded.venues_hero_image,
        venues_hero_title = excluded.venues_hero_title,
        venues_hero_subtitle = excluded.venues_hero_subtitle,
        ccas_hero_image = excluded.ccas_hero_image,
        ccas_hero_title = excluded.ccas_hero_title,
        ccas_hero_subtitle = excluded.ccas_hero_subtitle,
        notice_hero_image = excluded.notice_hero_image,
        notice_hero_title = excluded.notice_hero_title,
        notice_hero_subtitle = excluded.notice_hero_subtitle,
        ui_texts = excluded.ui_texts,
        hide_site_name = excluded.hide_site_name,
        marketing_live_ccas = excluded.marketing_live_ccas,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      site_name || '',
      admin_phone || '',
      admin_email || '',
      admin_sns || '',
      hq_address || '',
      logo_url || '',
      favicon_url || '',
      venues_hero_image || '',
      venues_hero_title || '',
      venues_hero_subtitle || '',
      ccas_hero_image || '',
      ccas_hero_title || '',
      ccas_hero_subtitle || '',
      notice_hero_image || '',
      notice_hero_title || '',
      notice_hero_subtitle || '',
      ui_texts || '',
      hide_site_name || 'false',
      marketing_live_ccas || 'true'
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
};
