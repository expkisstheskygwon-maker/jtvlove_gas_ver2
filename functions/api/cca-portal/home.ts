// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);

  // GET: CCA Portal Home 전체 데이터 조회
  if (request.method === "GET") {
    const ccaId = url.searchParams.get("ccaId");
    if (!ccaId) {
      return new Response(JSON.stringify({ error: "ccaId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // 1. CCA 기본 정보
      const cca = await env.DB.prepare(
        "SELECT c.*, v.name as venue_name FROM ccas c LEFT JOIN venues v ON c.venue_id = v.id WHERE c.id = ?"
      ).bind(ccaId).first();

      // 2. 오늘 예약 목록 (최대 3개)
      const { results: reservations } = await env.DB.prepare(
        "SELECT * FROM reservations WHERE cca_id = ? AND reservation_date = ? ORDER BY reservation_time ASC LIMIT 3"
      ).bind(ccaId, today).all();

      // 3. 고객 메시지 (미답변 우선, 최신순 5개)
      const { results: customerMessages } = await env.DB.prepare(
        "SELECT * FROM customer_messages WHERE cca_id = ? ORDER BY replied ASC, created_at DESC LIMIT 5"
      ).bind(ccaId).all();

      // 4. 관리자 메시지 (최신순)
      const { results: adminMessages } = await env.DB.prepare(
        "SELECT * FROM admin_messages WHERE cca_id = ? ORDER BY created_at DESC LIMIT 5"
      ).bind(ccaId).all();

      // 5. 업체 공지사항 (고정 우선, 최신순)
      const venueId = cca?.venue_id;
      const { results: notices } = await env.DB.prepare(
        "SELECT * FROM venue_notices WHERE venue_id = ? ORDER BY is_pinned DESC, created_at DESC LIMIT 5"
      ).bind(venueId).all();

      // 6. 오늘 출퇴근 상태
      const attendance = await env.DB.prepare(
        "SELECT * FROM cca_attendance WHERE cca_id = ? AND attendance_date = ?"
      ).bind(ccaId, today).first();

      return new Response(JSON.stringify({
        cca,
        reservations: reservations || [],
        customerMessages: customerMessages || [],
        adminMessages: adminMessages || [],
        notices: notices || [],
        attendance,
        today,
      }), {
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
