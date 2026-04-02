// Cloudflare worker types
type D1Database = any;
type PagesFunction<T> = any;

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context: { env: Env; request: Request }) => {
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
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // 1. CCA 기본 정보
      const cca = await env.DB.prepare(
        "SELECT c.*, v.name as venue_name FROM ccas c LEFT JOIN venues v ON c.venue_id = v.id WHERE c.id = ?"
      ).bind(ccaId).first();

      if (!cca) {
        return new Response(JSON.stringify({ error: "CCA profile not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. 오늘/내일 예약 목록
      const { results: reservations } = await env.DB.prepare(
        `SELECT * FROM reservations 
         WHERE (cca_id = ? OR cca_ids LIKE ?) 
         AND (reservation_date = ? OR reservation_date = ?)
         AND status != 'cancelled'
         ORDER BY reservation_date ASC, reservation_time ASC LIMIT 10`
      ).bind(ccaId, `%${ccaId}%`, today, tomorrow).all();

      // 3. 고객 메시지 (customer_messages 테이블 + unified messages 테이블 통합)
      // 최신순으로 10개
      const { results: oldCustomerMessages } = await env.DB.prepare(
        "SELECT id, customer_name, message, is_read, replied, created_at FROM customer_messages WHERE cca_id = ? ORDER BY created_at DESC"
      ).bind(ccaId).all() || { results: [] };

      const { results: unifiedCustomerMessages } = await env.DB.prepare(
        "SELECT id, sender_name as customer_name, content as message, is_read, replied, created_at FROM messages WHERE receiver_id = ? AND sender_type = 'user' ORDER BY created_at DESC"
      ).bind(ccaId).all() || { results: [] };

      const customerMessages = [...(oldCustomerMessages || []), ...(unifiedCustomerMessages || [])]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // 4. 관리자 메시지 (admin_messages + unified messages from admin)
      const { results: oldAdminMessages } = await env.DB.prepare(
        "SELECT id, sender_name, title, message, is_read, priority, created_at FROM admin_messages WHERE cca_id = ? ORDER BY created_at DESC"
      ).bind(ccaId).all() || { results: [] };

      const { results: unifiedAdminMessages } = await env.DB.prepare(
        "SELECT id, sender_name, subject as title, content as message, is_read, 'normal' as priority, created_at FROM messages WHERE receiver_id = ? AND (sender_type = 'admin' OR sender_type = 'venue_admin') ORDER BY created_at DESC"
      ).bind(ccaId).all() || { results: [] };

      const adminMessages = [...(oldAdminMessages || []), ...(unifiedAdminMessages || [])]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // 5. 업체 공지사항
      const venueId = cca?.venue_id;
      let notices: any[] = [];
      if (venueId) {
        const result = await env.DB.prepare(
          "SELECT * FROM venue_notices WHERE venue_id = ? ORDER BY is_pinned DESC, created_at DESC LIMIT 10"
        ).bind(venueId).all();
        notices = result.results || [];
      }

      const getBusinessDate = () => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        if (utcHours === 0 && utcMinutes < 30) {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return yesterday.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
      };

      const businessDate = getBusinessDate();

      // 6. 오늘 출퇴근 상태 (현재 영업일 기준 최근 기록)
      const attendance = await env.DB.prepare(
        "SELECT * FROM cca_attendance WHERE cca_id = ? AND attendance_date = ? ORDER BY check_in_at DESC LIMIT 1"
      ).bind(ccaId, businessDate).first();

      return new Response(JSON.stringify({
        cca,
        reservations: reservations || [],
        customerMessages,
        adminMessages,
        notices,
        attendance,
        today: businessDate,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("CCAPortalHome Backend Error:", error);
      return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
