import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "base64", name: "Base64", category: "Dev",
  blurb: "Encodes and decodes Base64, UTF-8 safe.",
  description: "Encode text to Base64 or decode Base64 to text. UTF-8 safe, with URL-safe option. Runs in your browser.",
  keywords: ["base64", "encode", "decode", "utf-8", "atob", "btoa"],
  recipe: { name: "Base64", input: "Nothing exciting happens here.", steps: [{ b: "base64", p: { mode: "encode", urlSafe: false } }] },
};

export function b64encode(s: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(s);
  let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const out = btoa(bin);
  return urlSafe ? out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : out;
}
export function b64decode(s: string): string {
  const clean = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error("This is not valid Base64. It may contain characters outside A-Z, a-z, 0-9, +, / or =.");
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  let bin: string;
  try { bin = atob(padded); } catch { throw new Error("This is not valid Base64. Check that nothing was cut off."); }
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const blocks: BlockDef[] = [{
  id: "base64", name: "Base64", category: "Dev", description: "Encode or decode Base64.",
  params: [sel("mode", "Direction", [["encode", "Encode"], ["decode", "Decode"]]), bool("urlSafe", "URL-safe alphabet (encode)", false)],
  run: (input, p) => {
    if (p.mode === "decode") {
      try { return b64decode(input); } catch (e) {
        if (e instanceof TypeError) throw new Error("This decoded to bytes that are not valid text (UTF-8). It may be a binary file.");
        throw e;
      }
    }
    return b64encode(input, Boolean(p.urlSafe));
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputName: "base64.txt", inputRows: 7 });
