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
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  };

  // Top-level fatal error wrapper to prevent worker crash / ERR_CONNECTION_CLOSED
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Diagnostic: check what bindings are actually available
    const envKeys = env ? Object.keys(env) : [];
    const hasR2 = !!env?.R2;

    if (!hasR2) {
      console.error('R2 binding missing. Available env keys:', envKeys);
      return new Response(JSON.stringify({
        error: 'R2 bucket binding is not configured',
        debug: {
          availableBindings: envKeys,
          hint: 'Add R2 binding in Cloudflare Pages Dashboard → Settings → Functions → R2 bucket bindings'
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders }
      });
    }

    try {
      const decodedKey = decodeURIComponent(key);
      const obj: any = await env.R2.get(decodedKey);
      if (!obj || !obj.body) {
        return new Response(JSON.stringify({ error: 'Not found', key: decodedKey }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
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

      // 바디를 완전히 버퍼화해서 반환하도록 변경 (에지 스트리밍 전달 실패 방지)
      let bodyBuffer: ArrayBuffer;
      try {
        if (typeof obj.arrayBuffer === 'function') {
          bodyBuffer = await obj.arrayBuffer();
        } else if (obj && obj.body) {
          bodyBuffer = await new Response(obj.body).arrayBuffer();
        } else {
          bodyBuffer = new ArrayBuffer(0);
        }
      } catch (readError: any) {
        console.error('R2 read body failed for key', decodedKey, readError);
        return new Response(JSON.stringify({ error: 'Failed to read object body', detail: readError?.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders }
        });
      }

      const responseHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Content-Length': String(bodyBuffer.byteLength),
        'X-Served-By': 'r2-proxy',
        'X-Content-Type-Options': 'nosniff',
        'Content-Encoding': 'identity',
        ...corsHeaders
      };

      console.log('R2 proxy success', { key: decodedKey, size: bodyBuffer.byteLength, contentType });

      return new Response(bodyBuffer, {
        status: 200,
        headers: responseHeaders
      });
    } catch (error: any) {
      console.error('R2 proxy error:', error);
      return new Response(JSON.stringify({ error: error.message || 'R2 proxy error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  } catch (fatalError: any) {
    // This catch prevents the worker from crashing entirely
    console.error('R2 proxy FATAL:', fatalError);
    return new Response(JSON.stringify({
      error: 'R2 proxy fatal error',
      detail: fatalError?.message || String(fatalError)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
};

// HEAD 요청 처리: 바디 없이 동일 메타데이터 헤더만 반환하여 캐시/프록시가 올바르게 인식하도록 함
export const onRequestHead = async (context: { request: Request; env: Env }) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(null, { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!env?.R2) {
      return new Response(null, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      const decodedKey = decodeURIComponent(key);
      const obj: any = await env.R2.get(decodedKey);
      if (!obj) {
        return new Response(null, { status: 404 });
      }

      const contentType =
        obj.httpMetadata?.contentType || obj.metadata?.contentType || guessContentType(decodedKey);

      const cacheControl =
        obj.httpMetadata?.cacheControl || obj.metadata?.cacheControl || 'public, max-age=31536000';

      const contentLength = obj.size ? String(obj.size) : (obj.httpMetadata?.contentLength ? String(obj.httpMetadata.contentLength) : undefined);

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'X-Served-By': 'r2-proxy',
        'X-Content-Type-Options': 'nosniff'
      };

      if (contentLength) headers['Content-Length'] = contentLength;

      console.log('R2 proxy HEAD', { key: decodedKey, contentType, contentLength });

      return new Response(null, { status: 200, headers });
    } catch (err: any) {
      console.error('R2 HEAD error', err);
      return new Response(null, { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (fatalError: any) {
    console.error('R2 HEAD FATAL:', fatalError);
    return new Response(null, { status: 500 });
  }
};
