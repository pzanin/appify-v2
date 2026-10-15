export const INTERACTIVE_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob: appify-asset:; connect-src appify-asset:; font-src data:; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

export const LINK_BRIDGE_HASH = 'sha256-kGzQB9GbvicN83p1J+Gssg+Xth8rzsK2Q7bZ9Aa6Dbg=';
export const VIDEO_BRIDGE_HASH = 'sha256-0sZXUcTMZSV45qEMdAgBjIGlweGfqZmtbLdi+xGImas=';
export const AUDIO_BRIDGE_HASH = 'sha256-CJoPT9Q9CZoTnM9T5f3881uBnBAN5gVpZjIg+Wq1cd0=';

export function electronCsp(development = false) {
  return `default-src 'self'; script-src 'self' ${development ? "'unsafe-inline'" : ` '${LINK_BRIDGE_HASH}' '${VIDEO_BRIDGE_HASH}' '${AUDIO_BRIDGE_HASH}'`}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: data: blob:; media-src 'self' https: data: blob: appify-asset:; connect-src 'self' https: appify-asset:${development ? ' http://localhost:3000 http://127.0.0.1:3000 ws://localhost:3000 ws://127.0.0.1:3000' : ''}; frame-src 'self' https: appify-content:; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'self' blob:`;
}
