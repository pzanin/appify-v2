export interface BuyerAccessAdapter {
  verifiedEmail(accessToken: string): Promise<string | null>;
  hasActiveEntitlement(productId: string, normalizedEmail: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024;
const MAX_EMAIL_LENGTH = 254;

export function normalizeBuyerEmail(value: string) {
  return value.trim().toLowerCase();
}

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

function response(status: number, body?: Record<string, unknown>, origin = '') {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  };
  // The endpoint uses an explicit bearer token, never cookies. Reflect only HTTPS
  // origins so installed PWAs can call it without making the origin an authority.
  if (/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  }
  if (!body) return new Response(null, { status, headers });
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify(body), { status, headers });
}

export function createBuyerAccessHandler(adapter: BuyerAccessAdapter) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') return response(204, undefined, origin);
    if (request.method !== 'POST') return response(405, undefined, origin);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return response(415, undefined, origin);
    }

    const authorization = request.headers.get('authorization') || '';
    const match = /^Bearer ([A-Za-z0-9._~-]{20,4096})$/.exec(authorization);
    if (!match) return response(401, { error: 'access_unavailable' }, origin);

    let payload: unknown;
    try {
      payload = await readJson(request);
    } catch {
      return response(400, { error: 'invalid_request' }, origin);
    }
    if (!validProductRequest(payload)) return response(400, { error: 'invalid_request' }, origin);

    try {
      const email = await adapter.verifiedEmail(match[1]);
      if (!email || email.length > MAX_EMAIL_LENGTH) {
        return response(401, { error: 'access_unavailable' }, origin);
      }
      const normalizedEmail = normalizeBuyerEmail(email);
      const hasAccess = await adapter.hasActiveEntitlement(payload.productId, normalizedEmail);
      return response(200, { hasAccess }, origin);
    } catch {
      // Keep Auth, SQL and infrastructure details out of the buyer-facing API.
      return response(503, { error: 'access_unavailable' }, origin);
    }
  };
}
