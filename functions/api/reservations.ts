// Fix: Added missing Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;

  try {
    const data: any = await request.json();
    const id = crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO reservations (id, venue_id, cca_id, customer_name, reservation_time, reservation_date, customer_note, group_size, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      data.venueId,
      data.ccaId,
      data.customerName,
      data.time,
      data.date,
      data.customerNote || '',
      data.groupSize || 1,
      'pending',
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};