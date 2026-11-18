// Share links carry the sketch in the URL fragment (#s=...), which never reaches the server.
// The code is deflate-compressed and base64url-encoded: 'z' + data. Browsers without
// CompressionStream fall back to uncompressed UTF-8: 'u' + data.

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  if (typeof CompressionStream === 'undefined') return 'u' + toBase64Url(bytes);
  return 'z' + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
}

export async function decodeCode(data: string): Promise<string> {
  const kind = data[0];
  const bytes = fromBase64Url(data.slice(1));
  if (kind === 'u') return new TextDecoder().decode(bytes);
  if (kind === 'z') return new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')));
  throw new Error('unknown share link format');
}

/** The shared code in the current URL's fragment, if there is one. */
export function sharedData(): string | null {
  const match = /(?:^#|&)s=([A-Za-z0-9_-]+)/.exec(location.hash);
  return match ? match[1] : null;
}

/** True when the page was opened as an embed: ?embed. */
export function isEmbed(): boolean {
  return new URLSearchParams(location.search).has('embed');
}

/** A link that opens the code in Vexel, or shows only its preview with `embed`. */
export async function shareUrl(code: string, embed = false): Promise<string> {
  const base = location.origin + location.pathname;
  return base + (embed ? '?embed' : '') + '#s=' + (await encodeCode(code));
}

/** HTML that embeds the sketch in another page. */
export async function embedCode(code: string): Promise<string> {
  const url = await shareUrl(code, true);
  return (
    '<iframe src="' + url.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '" width="640" height="400" ' +
    'style="border: 0; border-radius: 8px" loading="lazy" title="Vexel sketch" allowfullscreen></iframe>'
  );
}
