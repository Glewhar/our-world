/**
 * Fetch helpers that transparently pick up `.gz` siblings.
 *
 * Production deploys ship the bake artifacts as `*.bin.gz` / `*.json.gz`
 * (see `data-pipeline/src/earth_pipeline/compress.py`) so the static-host
 * payload is ~20 MB instead of ~245 MB. The browser decompresses via
 * `DecompressionStream`, which is a standard Web API in every modern
 * browser (Chrome 80+, Firefox 113+, Safari 16.4+) — no polyfill.
 *
 * The dev server (`vite.config.ts` middleware) serves the same `.gz`
 * artifacts from `/web/world/` with `Content-Encoding: gzip`, so dev
 * and prod see byte-identical bytes. The plain-URL fallback below
 * covers the rare static host that strips the `.gz` filename itself.
 *
 * Strategy:
 *   1. HEAD-less: request `${url}.gz` first.
 *   2. Decide whether the response is really gzipped:
 *      - `Content-Encoding: gzip` → transport already decompressed
 *        (`vite preview` / sirv / many CDNs do this); read body as-is.
 *      - `Content-Type: text/html` → Vite's dev-server SPA fallback for a
 *        missing file returns index.html with status 200 — treat as 404.
 *      - Magic bytes `1f 8b` at offset 0 → real gzip payload, decompress
 *        ourselves. Anything else → not gzip, treat as 404.
 *   3. On 404 (or any non-OK / not-actually-gzipped), fall back to plain
 *      `${url}`.
 */

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

/**
 * Returns the decompressed payload, OR `null` if the response wasn't
 * actually a valid gzipped artifact (e.g. SPA fallback HTML). Caller
 * falls back to the plain URL when this returns null.
 */
async function readGzippedOrNull(response: Response): Promise<ArrayBuffer | null> {
  // If the transport already decompressed (server sent the gzipped bytes
  // with `Content-Encoding: gzip`), the body is plain — don't double-
  // decode. Trust the Content-Encoding header in that case.
  if (response.headers.get('content-encoding')?.toLowerCase() === 'gzip') {
    return await response.arrayBuffer();
  }
  // Vite's dev server SPA-fallback returns index.html with `200 OK` for
  // any unknown URL. Don't waste time trying to gunzip HTML.
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    await response.body?.cancel();
    return null;
  }
  // Otherwise the body should be a literal gzipped payload — verify the
  // magic bytes before piping through DecompressionStream so we degrade
  // gracefully on hosts that return some other 200 (e.g. an HTML 404
  // page without the text/html content-type, a custom redirect page).
  const buf = await response.arrayBuffer();
  const view = new Uint8Array(buf);
  if (view.length < 2 || view[0] !== GZIP_MAGIC_0 || view[1] !== GZIP_MAGIC_1) {
    return null;
  }
  const stream = new Blob([buf])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).arrayBuffer();
}

export async function fetchMaybeGz(url: string): Promise<ArrayBuffer> {
  const gzResponse = await fetch(`${url}.gz`);
  if (gzResponse.ok) {
    const buf = await readGzippedOrNull(gzResponse);
    if (buf !== null) return buf;
  } else {
    // Drain the failed body so the connection can be reused.
    await gzResponse.body?.cancel();
  }

  const plain = await fetch(url);
  if (!plain.ok) {
    throw new Error(`fetch failed: ${plain.status} ${plain.statusText} (${url})`);
  }
  return await plain.arrayBuffer();
}

export async function fetchMaybeGzJson<T>(url: string): Promise<T> {
  const gzResponse = await fetch(`${url}.gz`);
  if (gzResponse.ok) {
    const buf = await readGzippedOrNull(gzResponse);
    if (buf !== null) {
      const text = new TextDecoder('utf-8').decode(buf);
      return JSON.parse(text) as T;
    }
  } else {
    await gzResponse.body?.cancel();
  }

  const plain = await fetch(url);
  if (!plain.ok) {
    throw new Error(`fetch failed: ${plain.status} ${plain.statusText} (${url})`);
  }
  return (await plain.json()) as T;
}
