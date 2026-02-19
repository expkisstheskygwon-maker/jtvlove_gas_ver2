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
      "SELECT * FROM venues"
    ).all();

    // JSON 문자열로 저장된 tags와 features를 객체로 변환
    const formattedResults = results.map((v: any) => ({
      ...v,
      tags: v.tags ? JSON.parse(v.tags) : [],
      features: v.features ? JSON.parse(v.features) : []
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