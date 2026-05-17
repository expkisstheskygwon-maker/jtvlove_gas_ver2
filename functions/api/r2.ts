// Simple R2 proxy endpoint
type R2Bucket = any;

interface Env {
  R2: R2Bucket;
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

    const headers: any = {};
    const contentType = obj.httpMetadata?.contentType || obj.metadata?.contentType;
    if (contentType) headers['Content-Type'] = contentType;
    headers['Cache-Control'] = obj.httpMetadata?.cacheControl || obj.metadata?.cacheControl || 'public, max-age=31536000';

    return new Response(obj.body, { status: 200, headers });
  } catch (error: any) {
    console.error('R2 proxy error:', error);
    return new Response(JSON.stringify({ error: error.message || 'R2 proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
