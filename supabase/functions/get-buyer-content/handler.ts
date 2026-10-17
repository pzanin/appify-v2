export interface BuyerContentAdapter {
  verifiedEmail(accessToken: string): Promise<string | null>;
  hasActiveEntitlement(productId: string, normalizedEmail: string): Promise<boolean>;
  createSignedContentUrl(productId: string, expiresInSeconds: number): Promise<string>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024;
const SIGNED_URL_TTL_SECONDS = 120;

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('Request body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function validProductRequest(value: unknown): value is { productId: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  return Object.keys(object).length === 1
    && typeof object.productId === 'string'
    && UUID.test(object.productId);
}

function jsonResponse(status: number, body: Record<string, unknown>, origin: string) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
  if (/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function emptyResponse(status: number, origin: string) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  }
  return new Response(null, { status, headers });
}

export function createBuyerContentHandler(adapter: BuyerContentAdapter) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') return emptyResponse(204, origin);
    if (request.method !== 'POST') return emptyResponse(405, origin);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return jsonResponse(415, { error: 'content_unavailable' }, origin);
    }
    const match = /^Bearer ([A-Za-z0-9._~-]{20,4096})$/.exec(request.headers.get('authorization') || '');
    if (!match) return jsonResponse(401, { error: 'content_unavailable' }, origin);

    let payload: unknown;
    try {
      payload = await readJson(request);
    } catch {
      return jsonResponse(400, { error: 'invalid_request' }, origin);
    }
    if (!validProductRequest(payload)) return jsonResponse(400, { error: 'invalid_request' }, origin);

    try {
      const email = await adapter.verifiedEmail(match[1]);
      if (!email || email.length > 254) return jsonResponse(401, { error: 'content_unavailable' }, origin);
      const hasAccess = await adapter.hasActiveEntitlement(payload.productId, email.trim().toLowerCase());
      if (!hasAccess) return jsonResponse(403, { error: 'content_unavailable' }, origin);
      const url = await adapter.createSignedContentUrl(payload.productId, SIGNED_URL_TTL_SECONDS);
      return jsonResponse(200, { url, expiresIn: SIGNED_URL_TTL_SECONDS }, origin);
    } catch {
      return jsonResponse(503, { error: 'content_unavailable' }, origin);
    }
  };
}
