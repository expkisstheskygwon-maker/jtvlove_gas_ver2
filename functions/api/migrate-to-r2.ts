/**
 * Database migration: Base64 images → R2 URLs
 * 
 * Usage:
 * POST /api/migrate-to-r2
 * Body: { tables: ['ccas', 'users', 'gallery', 'hero_sections'] }
 * 
 * This script migrates existing base64-encoded images to R2 storage
 * and updates database records with public R2 URLs.
 */

type R2Bucket = any;
type D1Database = any;

interface Env {
  R2: R2Bucket;
  DB: D1Database;
}

interface MigrationProgress {
  table: string;
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}


function isBase64DataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:');
}

function parseBase64DataUrl(dataUrl: string): { mime: string; buffer: ArrayBuffer } | null {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    
    const mime = match[1];
    const base64 = match[2];
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return { mime, buffer: bytes.buffer };
  } catch (error) {
    console.error('Failed to parse base64:', error);
    return null;
  }
}

function getExtensionFromMime(mime: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[mime] || 'bin';
}

async function uploadBase64ToR2(env: Env, base64DataUrl: string, type: string, id: string): Promise<string | null> {
  try {
    const parsed = parseBase64DataUrl(base64DataUrl);
    if (!parsed) return null;

    const ext = getExtensionFromMime(parsed.mime);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const key = `${type}/${dateStr}/${id}.${ext}`;

    await env.R2.put(key, parsed.buffer, {
      httpMetadata: {
        contentType: parsed.mime,
        cacheControl: 'public, max-age=31536000',
      },
    });

    return `/api/r2?key=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('R2 upload failed:', error);
    return null;
  }
}

async function migrateTable(
  env: Env,
  tableName: string,
  imageFields: string[]
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    table: tableName,
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all records with image fields
    const { results } = await env.DB.prepare(
      `SELECT id, ${imageFields.join(', ')} FROM ${tableName}`
    ).all();

    progress.total = results.length;

    for (const record of results) {
      let hasChanges = false;
      const updates: string[] = [];
      const values: any[] = [];

      for (const field of imageFields) {
        const value = record[field];
        if (value && isBase64DataUrl(value)) {
          const r2Url = await uploadBase64ToR2(env, value, tableName, record.id);
          if (r2Url) {
            updates.push(`${field} = ?`);
            values.push(r2Url);
            hasChanges = true;
          } else {
            progress.failed++;
            progress.errors.push(`${tableName}:${record.id}:${field} - upload failed`);
          }
        }
      }

      if (hasChanges) {
        values.push(record.id);
        const query = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`;
        await env.DB.prepare(query).bind(...values).run();
        progress.migrated++;
      }
    }
  } catch (error: any) {
    progress.errors.push(`Table ${tableName} error: ${error.message}`);
  }

  return progress;
}

export const onRequest: any = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tables = body.tables || ['ccas', 'users', 'gallery', 'hero_sections'];

    const results: { [key: string]: any } = {};

    // Migration mapping: table -> image fields
    const migrations = {
      ccas: ['image'],
      users: ['profile_image'],
      gallery: ['url'], // Note: gallery.url might be both base64 and external URLs
      hero_sections: ['image_url'],
      cca_applications: ['image'],
    };

    for (const table of tables) {
      const fields = migrations[table as keyof typeof migrations];
      if (fields) {
        results[table] = await migrateTable(env, table, fields);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Migration completed',
      summary: results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
