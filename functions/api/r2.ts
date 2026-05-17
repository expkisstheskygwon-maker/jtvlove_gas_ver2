// R2 Proxy - 이미지를 안전하게 서빙하는 프록시 엔드포인트
type R2Bucket = any;

interface Env {
  R2: R2Bucket;
}

// 확장자로 Content-Type 유추
function guessContentType(key: string): string {
  const ext = key.includes('.') ? (key.split('.').pop() || '').toLowerCase() : '';
  const map: Record<string, string> = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
    'bmp': 'image/bmp', 'ico': 'image/x-icon',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
  };
  return map[ext] || 'image/jpeg';
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.R2) {
    return new Response(JSON.stringify({ error: 'R2 bucket binding is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const decodedKey = decodeURIComponent(key);
    const obj: any = await env.R2.get(decodedKey);
    if (!obj || !obj.body) {
      return new Response('Not found', { status: 404 });
    }

    // Content-Type 결정: R2 메타데이터 → 키(파일명) 확장자 유추 → image/jpeg 기본값
    const contentType =
      obj.httpMetadata?.contentType ||
      obj.metadata?.contentType ||
      guessContentType(decodedKey);

    const cacheControl =
      obj.httpMetadata?.cacheControl ||
      obj.metadata?.cacheControl ||
      'public, max-age=31536000';

    return new Response(obj.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      }
    });
  } catch (error: any) {
    console.error('R2 proxy error:', error);
    return new Response(JSON.stringify({ error: error.message || 'R2 proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
