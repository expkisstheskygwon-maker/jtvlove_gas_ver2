
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

    // 파일 타입 검증 (위험한 파일만 차단하고 모두 허용하여 클립보드 업로드 등 지원)
    const fileType = (file.type || '').toLowerCase();
    const fileName = file.name || 'file';
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || 'bin' : 'bin';
    
    const dangerousExts = ['html', 'htm', 'exe', 'sh', 'bat', 'php', 'js'];
    if (dangerousExts.includes(ext)) {
      return new Response(JSON.stringify({ error: `Dangerous file extension not allowed: ${ext}` }), {
        status: 400,
        headers,
      });
    }

    // 파일명 생성: {type}/YYYY-MM-DD/{uuid}.{ext}
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const uuid = crypto.randomUUID();
    const key = `${type}/${dateStr}/${uuid}.${ext}`;

    // R2가 연결되어 있는 경우 R2에 업로드 시도
    if (env.R2) {
      try {
        const buffer = file.arrayBuffer ? await file.arrayBuffer() : await new Response(file).arrayBuffer();
        await env.R2.put(key, buffer, {
          httpMetadata: {
            contentType: fileType || 'application/octet-stream',
            cacheControl: 'public, max-age=31536000', // 1년 캐시
          },
        });

        // R2 커스텀 도메인 대신 DNS 및 CORS 이슈가 없는 로컬 프록시 URL 사용
        const publicUrl = `/api/r2?key=${encodeURIComponent(key)}`;

        return new Response(JSON.stringify({ 
          success: true,
          url: publicUrl,
          key: key
        }), {
          status: 200,
          headers,
        });
      } catch (r2Error: any) {
        console.error('R2 put failed, falling back to Base64:', r2Error);
        // R2 업로드 중 예외 발생 시, 서비스가 중단되는 대신 Base64 데이터 URL로 자동 전환되어 업로드 성공을 보장합니다.
      }
    }

    // R2가 바인딩되지 않았거나 R2 업로드 도중 에러가 발생한 경우 (로컬 개발 환경 또는 Pages 대시보드 미연결/오류 시)
    // ArrayBuffer를 읽어 Base64 데이터 URL로 저장하는 기존 방식으로 자동 대체
    const arrayBuffer = file.arrayBuffer ? await file.arrayBuffer() : await new Response(file).arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const dataUrl = `data:${fileType || 'application/octet-stream'};base64,${base64}`;

    return new Response(JSON.stringify({ 
      success: true,
      url: dataUrl
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
