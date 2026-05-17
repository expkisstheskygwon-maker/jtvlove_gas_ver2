
// Cloudflare Types
type R2Bucket = any;
type D1Database = any;

interface Env {
  R2: R2Bucket;
  DB: D1Database;
}

// GET: Not supported
export const onRequestGet = async () => {
  return new Response("Method not allowed", { status: 405 });
};

// POST: 이미지 업로드 → R2 처리
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json" };

  try {
    // ADDED: Explicitly check for multipart/form-data content type
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: "Invalid Content-Type. Expected multipart/form-data." }), {
        status: 400,
        headers,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'misc'; // 'profile', 'gallery', 'banner', 'misc'
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers,
      });
    }

    // 파일 크기 제한 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: `File size too large (max ${MAX_SIZE / 1024 / 1024}MB)` }), {
        status: 400,
        headers,
      });
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "File type not allowed" }), {
        status: 400,
        headers,
      });
    }

    // 파일명 생성: {type}/YYYY-MM-DD/{uuid}.{ext}
    const ext = file.name.split('.').pop() || 'bin';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const uuid = crypto.randomUUID();
    const key = `${type}/${dateStr}/${uuid}.${ext}`;

    // R2에 업로드
    const buffer = await file.arrayBuffer();
    await env.R2.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1년 캐시
      },
    });

    // 공개 URL 생성: 내부 프록시를 통해 R2에 접근합니다
    const publicUrl = `/api/r2?key=${encodeURIComponent(key)}`;

    return new Response(JSON.stringify({ 
      success: true,
      url: publicUrl,
      key: key
    }), {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message || "Upload failed" }), {
      status: 500,
      headers,
    });
  }
};
