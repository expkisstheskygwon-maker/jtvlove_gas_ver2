// Fix: Added missing Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  try {
    const { results } = await env.DB.prepare(`
      SELECT c.*, v.name as venueName 
      FROM ccas c 
      JOIN venues v ON c.venue_id = v.id
    `).all();

    const formattedResults = results.map((c: any) => ({
      ...c,
      languages: c.languages ? JSON.parse(c.languages) : [],
      venueId: c.venue_id // DB 필드명 대응
    }));

    return new Response(JSON.stringify(formattedResults), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};