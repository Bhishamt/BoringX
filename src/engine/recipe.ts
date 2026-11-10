import type { Recipe } from "./types";

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const w = stream.writable.getWriter();
  void w.write(bytes as unknown as BufferSource);
  void w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/** Encode a recipe into a URL-safe string. "z." prefix means deflate-compressed. */
export async function encodeRecipe(r: Recipe): Promise<string> {
  const raw = enc.encode(JSON.stringify(r));
  if (typeof CompressionStream !== "undefined") {
    try {
      return "z." + toB64Url(await pipe(raw, new CompressionStream("deflate-raw")));
    } catch { /* fall through */ }
  }
  return "p." + toB64Url(raw);
}

export async function decodeRecipe(s: string): Promise<Recipe> {
  const kind = s.slice(0, 2);
  const body = fromB64Url(s.slice(2));
  const json =
    kind === "z." ? dec.decode(await pipe(body, new DecompressionStream("deflate-raw"))) : dec.decode(body);
  const r = JSON.parse(json);
  if (!r || !Array.isArray(r.steps)) throw new Error("This link does not contain a valid recipe.");
  return {
    name: typeof r.name === "string" ? r.name : "",
    input: typeof r.input === "string" ? r.input : "",
    steps: r.steps.map((s: { b: unknown; p?: unknown }) => ({
      b: String(s.b),
      p: s.p && typeof s.p === "object" ? (s.p as Record<string, never>) : {},
    })),
  };
}

export async function recipeHref(r: Recipe): Promise<string> {
  return `/sandbox#r=${await encodeRecipe(r)}`;
}
