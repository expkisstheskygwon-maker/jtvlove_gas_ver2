
// Cloudflare worker types
type D1Database = any;
interface Env {
  DB: D1Database;
}

// GET: 히어로 섹션 목록 불러오기
export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;
  
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM hero_sections ORDER BY display_order ASC"
    ).all();
    
    // Map snake_case to camelCase for the frontend
    const mappedResults = (results || []).map((row: any) => ({
      id: row.id,
      ccaId: row.cca_id,
      badge1: row.badge1,
      badge2: row.badge2,
      title: row.title,
      content: row.content,
      buttonText: row.button_text,
      buttonLink: row.button_link,
      imageUrl: row.image_url,
      displayOrder: row.display_order
    }));
    
    return new Response(JSON.stringify(mappedResults), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST: 히어로 섹션 저장하기 (전체 업데이트)
export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { env, request } = context;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: "D1 Database binding 'DB' is missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { heroSections } = await request.json();

    // 트랜잭션 처리를 위해 일괄 삭제 후 삽입 (D1 batch 사용 권장되나 여기서는 단순화)
    // 1. 기존 데이터 삭제
    await env.DB.prepare("DELETE FROM hero_sections").run();

    // 2. 새 데이터 삽입 (최대 5개)
    const limitedSections = heroSections.slice(0, 5);
    
    if (limitedSections.length > 0) {
      const statements = limitedSections.map((section: any, index: number) => {
        return env.DB.prepare(`
          INSERT INTO hero_sections (cca_id, badge1, badge2, title, content, button_text, button_link, image_url, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          section.ccaId || null,
          section.badge1 || '',
          section.badge2 || '',
          section.title || '',
          section.content || '',
          section.buttonText || '',
          section.buttonLink || '',
          section.imageUrl || '',
          index
        );
      });
      
      await env.DB.batch(statements);
    }

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
