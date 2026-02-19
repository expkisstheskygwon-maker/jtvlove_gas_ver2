// Fix: Added missing Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM posts ORDER BY created_at DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};