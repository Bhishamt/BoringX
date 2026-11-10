import type { BlockDef, ToolMeta } from "@/engine/types";
import { sel, bool } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";
import { ALGOS, hashBytes, type Algo } from "@/lib/hash";

export const meta: ToolMeta = {
  slug: "hash", name: "Hash", category: "Dev",
  blurb: "SHA-256, SHA-1, MD5 and more, of text.",
  description: "Hash text with SHA-256, SHA-1, SHA-512 or MD5 in your browser. For files, use File Checksum.",
  keywords: ["hash", "sha256", "sha1", "md5", "checksum", "digest"],
  recipe: { name: "Hash", input: "Nothing exciting happens here.", steps: [{ b: "hash", p: { algo: "SHA-256", upper: false } }] },
};

export const blocks: BlockDef[] = [{
  id: "hash", name: "Hash", category: "Dev", description: "Hex digest of the input text (UTF-8).",
  params: [sel("algo", "Algorithm", ALGOS), bool("upper", "Uppercase hex", false)],
  run: async (input, p) => {
    const h = await hashBytes(String(p.algo) as Algo, new TextEncoder().encode(input));
    return p.upper ? h.toUpperCase() : h;
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputLabel: "Digest", outputName: "hash.txt", inputRows: 6 });
