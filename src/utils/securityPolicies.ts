export const LINK_BRIDGE_HASH = 'sha256-kGzQB9GbvicN83p1J+Gssg+Xth8rzsK2Q7bZ9Aa6Dbg=';

export function electronCsp(development = false) {
  return `default-src 'self'; script-src 'self' ${development ? "'unsafe-inline'" : ` '${LINK_BRIDGE_HASH}'`}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; connect-src 'self' https:${development ? ' http://localhost:3000 http://127.0.0.1:3000 ws://localhost:3000 ws://127.0.0.1:3000' : ''}; frame-src 'self' https:; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'self' blob:`;
}
