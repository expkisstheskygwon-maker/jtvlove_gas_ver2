
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

// MIME 타입 유추 헬퍼
function inferMimeType(fileName: string, rawType: string): string {
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
    'bmp': 'image/bmp', 'ico': 'image/x-icon', 'tiff': 'image/tiff',
    'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
  };

  // rawType이 유효한 image/video이면 그대로 사용
  if (rawType && (rawType.startsWith('image/') || rawType.startsWith('video/'))) {
    return rawType;
  }

  // 파일 이름에서 확장자 추출하여 유추
  const ext = fileName.includes('.') ? (fileName.split('.').pop() || '').toLowerCase() : '';
  if (ext && mimeMap[ext]) {
    return mimeMap[ext];
  }

  // 기본값: image/jpeg (이미지 업로드 전용 엔드포인트이므로)
  return 'image/jpeg';
}

// POST: 이미지 업로드 → R2 처리
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json" };

  try {
    // Content-Type 검증
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: "Invalid Content-Type. Expected multipart/form-data." }), {
        status: 400,
        headers,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const type = (formData.get('type') as string) || 'misc';

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers,
      });
    }

    // 파일 바이너리 데이터를 먼저 한 번만 읽어두기 (stream 이중 소비 방지)
    let fileBytes: ArrayBuffer;
    if (typeof (file as any).arrayBuffer === 'function') {
      fileBytes = await (file as any).arrayBuffer();
    } else {
      fileBytes = await new Response(file as any).arrayBuffer();
    }

    const fileSize = fileBytes.byteLength;
    const fileName = typeof (file as any).name === 'string' ? (file as any).name : 'upload';
    const rawType = typeof (file as any).type === 'string' ? (file as any).type : '';

    // 파일 크기 제한 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      return new Response(JSON.stringify({ error: `File size too large (max ${MAX_SIZE / 1024 / 1024}MB)` }), {
        status: 400,
        headers,
      });
    }

    // MIME 타입 유추
    const fileType = inferMimeType(fileName, rawType.toLowerCase());

    // 확장자 추출
    const ext = fileName.includes('.')
      ? (fileName.split('.').pop() || 'jpg').toLowerCase()
      : fileType.split('/')[1] || 'jpg'; // MIME 기반 확장자

    // 위험 파일 확장자 차단
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
        await env.R2.put(key, fileBytes, {
          httpMetadata: {
            contentType: fileType,
            cacheControl: 'public, max-age=31536000',
          },
        });

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
      }
    }

    // Base64 데이터 URL 폴백
    const base64 = btoa(
      new Uint8Array(fileBytes)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const dataUrl = `data:${fileType};base64,${base64}`;

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
