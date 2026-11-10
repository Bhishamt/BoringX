import type { BlockDef, ToolMeta } from "@/engine/types";
import { sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "url-encode", name: "URL Encode/Decode", category: "Dev",
  blurb: "Percent-encodes and decodes URLs and query values.",
  description: "Encode or decode URLs and query string values with percent-encoding. Runs in your browser.",
  keywords: ["url", "encode", "decode", "percent", "query string", "uri"],
  recipe: { name: "URL Encode", input: "https://example.com/search?q=boring tools & more&lang=fr é", steps: [{ b: "url-code", p: { mode: "encode", scope: "component" } }] },
};

export const blocks: BlockDef[] = [{
  id: "url-code", name: "URL encode/decode", category: "Dev", description: "Percent-encode or decode.",
  params: [sel("mode", "Direction", [["encode", "Encode"], ["decode", "Decode"]]), sel("scope", "Scope", [["component", "Component (encode everything)"], ["uri", "Whole URL (keep : / ? & =)"]])],
  run: (input, p) => {
    try {
      if (p.mode === "decode") return p.scope === "uri" ? decodeURI(input) : decodeURIComponent(input.replace(/\+/g, " "));
      return p.scope === "uri" ? encodeURI(input) : encodeURIComponent(input);
    } catch {
      throw new Error("Could not decode. A % sign is not followed by two hex digits, or the bytes are not valid UTF-8.");
    }
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputName: "url.txt", inputRows: 6 });
