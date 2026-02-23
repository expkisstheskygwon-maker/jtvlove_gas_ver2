
// GET: Not supported
export const onRequestGet = async () => {
  return new Response("Method not allowed", { status: 405 });
};

// POST: 이미지 업로드 처리
export const onRequestPost = async (context: { request: Request }) => {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 파일 크기 제한 (예: 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size too large (max 2MB)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cloudflare Pages Functions는 로컬 파일 시스템이 없으므로,
    // 여기서는 파일을 ArrayBuffer로 읽어 Base64로 변환하여 반환합니다.
    // D1의 TEXT 컬럼에 저장하기에 적합합니다.
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const dataUrl = `data:${file.type};base64,${base64}`;

    return new Response(JSON.stringify({ url: dataUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
