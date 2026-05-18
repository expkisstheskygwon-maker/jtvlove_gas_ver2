
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

interface MultipartFile {
  name: string;
  filename: string;
  type: string;
  data: ArrayBuffer;
}

// 100% 무손실 바이너리 멀티파트 파서 (Cloudflare request.formData()의 UTF-8 문자 인코딩 파손 우회)
function parseMultipart(body: ArrayBuffer, contentType: string): { file: MultipartFile | null, type: string } {
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return { file: null, type: 'misc' };
  
  const boundaryStr = '--' + boundaryMatch[1];
  const boundaryBytes = new TextEncoder().encode(boundaryStr);
  const bodyBytes = new Uint8Array(body);
  
  function findPattern(data: Uint8Array, pattern: Uint8Array, start = 0): number {
    if (pattern.length === 0) return -1;
    for (let i = start; i <= data.length - pattern.length; i++) {
      let found = true;
      for (let j = 0; j < pattern.length; j++) {
        if (data[i + j] !== pattern[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }
  
  const separatorBytes = new Uint8Array([0x0D, 0x0A, 0x0D, 0x0A]); // \r\n\r\n
  let file: MultipartFile | null = null;
  let type = 'misc';
  
  let currentPos = 0;
  while (true) {
    const boundaryIdx = findPattern(bodyBytes, boundaryBytes, currentPos);
    if (boundaryIdx === -1) break;
    
    const nextBoundaryIdx = findPattern(bodyBytes, boundaryBytes, boundaryIdx + boundaryBytes.length);
    if (nextBoundaryIdx === -1) break;
    
    const partStart = boundaryIdx + boundaryBytes.length + 2; // skip boundary and \r\n
    const partEnd = nextBoundaryIdx - 2; // exclude trailing \r\n
    if (partEnd <= partStart) {
      currentPos = nextBoundaryIdx;
      continue;
    }
    
    const partBytes = bodyBytes.subarray(partStart, partEnd);
    const headerEndIdx = findPattern(partBytes, separatorBytes);
    if (headerEndIdx === -1) {
      currentPos = nextBoundaryIdx;
      continue;
    }
    
    const headerText = new TextDecoder('utf-8').decode(partBytes.subarray(0, headerEndIdx));
    const partBody = partBytes.subarray(headerEndIdx + separatorBytes.length);
    
    const nameMatch = headerText.match(/name="([^"]+)"/);
    const filenameMatch = headerText.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
    
    const name = nameMatch ? nameMatch[1] : '';
    
    if (name === 'file' && filenameMatch) {
      file = {
        name,
        filename: filenameMatch[1],
        type: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
        data: partBody.slice().buffer
      };
    } else if (name === 'type') {
      type = new TextDecoder('utf-8').decode(partBody).trim();
    }
    
    currentPos = nextBoundaryIdx;
  }
  
  return { file, type };
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

    // 100% 무손실 바이너리 데이터 직접 수신 (request.formData()를 생략하여 UTF-8 오염을 완벽 차단)
    const bodyBuffer = await request.arrayBuffer();
    const { file, type } = parseMultipart(bodyBuffer, contentType);

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded or parsing failed" }), {
        status: 400,
        headers,
      });
    }

    const fileBytes = file.data;

    const fileSize = fileBytes.byteLength;
    const fileName = file.filename || 'upload';
    const rawType = file.type || '';

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
