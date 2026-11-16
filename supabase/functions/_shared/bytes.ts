// Byte helpers shared by Deno (Supabase Edge Functions) and Node (tests). WebCrypto only, no deps.

export function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function fromUtf8(b: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(b);
}

export function toBase64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

export function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** PostgREST sends and returns bytea as "\x<hex>". */
export function toPgBytea(b: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, '0');
  return '\\x' + hex;
}

export function fromPgBytea(v: string | null | undefined): Uint8Array | null {
  if (v == null) return null;
  if (!/^\\x([0-9a-fA-F]{2})*$/.test(v)) throw new Error('bad_bytea');
  const hex = v.slice(2);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Best-effort wipe of key material once it is no longer needed. */
export function wipe(b: Uint8Array | null | undefined): void {
  if (b) b.fill(0);
}
