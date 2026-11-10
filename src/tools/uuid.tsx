import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, num, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "uuid", name: "UUID", category: "Generate",
  blurb: "Generates v4 or v7 UUIDs in bulk.",
  description: "Generate random v4 or time-ordered v7 UUIDs in your browser, in bulk, with format options.",
  keywords: ["uuid", "guid", "v4", "v7", "random id", "generate"],
  recipe: { name: "UUID", input: "", steps: [{ b: "uuid", p: { count: 5, version: "v4", upper: false, hyphens: true } }] },
};

export function uuidv4(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  return fmt(b);
}
export function uuidv7(now = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let t = now;
  for (let i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); }
  b[6] = (b[6] & 0x0f) | 0x70; b[8] = (b[8] & 0x3f) | 0x80;
  return fmt(b);
}
const fmt = (b: Uint8Array) => {
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export const blocks: BlockDef[] = [{
  id: "uuid", name: "UUIDs", category: "Generate", description: "Replaces the text with fresh UUIDs, one per line.",
  params: [num("count", "How many", 5, 1, 1000), sel("version", "Version", [["v4", "v4 (random)"], ["v7", "v7 (time-ordered)"]]), bool("upper", "Uppercase", false), bool("hyphens", "Hyphens", true)],
  run: (_i, p) => {
    const n = Math.min(1000, Math.max(1, Math.floor(Number(p.count))));
    return Array.from({ length: n }, () => {
      let u = p.version === "v7" ? uuidv7() : uuidv4();
      if (!p.hyphens) u = u.replace(/-/g, "");
      return p.upper ? u.toUpperCase() : u;
    }).join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Input (ignored)", inputRows: 1, outputLabel: "UUIDs", outputName: "uuids.txt" });
