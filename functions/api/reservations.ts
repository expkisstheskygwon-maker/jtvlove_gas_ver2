
// Cloudflare worker types
type D1Database = any;
type PagesFunction<T, P = any> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { env, request } = context;
  const url = new URL(request.url);

  // POST: Create Reservation
  if (request.method === 'POST') {
    try {
      const data: any = await request.json();
      const id = data.id || crypto.randomUUID();

      // Check if user is banned
      const requestUserId = data.userId || data.user_id;
      if (requestUserId) {
        const userCheck = await env.DB.prepare("SELECT COALESCE(status, 'active') as status FROM users WHERE id = ?").bind(requestUserId).first();
        if (userCheck && userCheck.status === 'banned') {
          return new Response(JSON.stringify({ error: "활동이 정지된 계정입니다. 예약할 수 없습니다." }), {
            status: 403, headers: { "Content-Type": "application/json" },
          });
        }
      }

      await env.DB.prepare(
        "INSERT INTO reservations (id, venue_id, cca_id, cca_ids, customer_name, customer_contact, reservation_time, reservation_date, customer_note, group_size, table_id, room_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        id,
        data.venueId || data.venue_id,
        data.ccaId || data.cca_id || '',
        data.ccaIds ? JSON.stringify(data.ccaIds) : '[]',
        data.customerName || data.customer_name,
        data.customerContact || data.customer_contact || '',
        data.time || data.reservation_time,
        data.date || data.reservation_date,
        data.customerNote || data.customer_note || '',
        data.groupSize || data.group_size || 1,
        data.tableId || data.table_id || '',
        data.roomId || data.room_id || '',
        data.status || 'pending',
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
  }

  // GET: List Reservations (Filtering by venueId or ccaId)
  if (request.method === 'GET') {
    try {
      const venueId = url.searchParams.get('venueId');
      const ccaId = url.searchParams.get('ccaId');
      const date = url.searchParams.get('date');

      let query = "SELECT * FROM reservations";
      let whereClauses = [];
      let params = [];

      if (venueId) {
        whereClauses.push("venue_id = ?");
        params.push(venueId);
      }
      if (ccaId) {
        whereClauses.push("cca_id = ?");
        params.push(ccaId);
      }
      if (date) {
        whereClauses.push("reservation_date = ?");
        params.push(date);
      }

      if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
      }

      query += " ORDER BY reservation_date DESC, reservation_time DESC";

      const { results } = await env.DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // PATCH: Update Reservation
  if (request.method === 'PATCH') {
    try {
      const data: any = await request.json();
      const id = data.id || url.searchParams.get('id');

      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });

      // Build dynamic update
      const allowedFields = ['status', 'table_id', 'room_id', 'group_size', 'cca_ids', 'customer_note', 'reservation_time', 'reservation_date'];
      let updates = [];
      let params = [];

      for (const field of allowedFields) {
        const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        const value = data[field] !== undefined ? data[field] : data[camelField];

        if (value !== undefined) {
          updates.push(`${field} = ?`);
          params.push(field === 'cca_ids' && Array.isArray(value) ? JSON.stringify(value) : value);
        }
      }

      if (updates.length === 0) return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });

      params.push(id);
      await env.DB.prepare(`UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

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

  // DELETE: Remove Reservation
  if (request.method === 'DELETE') {
    try {
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });

      await env.DB.prepare("DELETE FROM reservations WHERE id = ?").bind(id).run();

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