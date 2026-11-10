import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, num, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "filler-text", name: "Filler Text", category: "Generate",
  blurb: "Lorem ipsum by the paragraph, sentence or word.",
  description: "Generate lorem ipsum placeholder text by paragraphs, sentences or words. Runs in your browser.",
  keywords: ["lorem ipsum", "placeholder", "dummy text", "filler", "generate"],
  recipe: { name: "Filler Text", input: "", steps: [{ b: "lorem", p: { unit: "paragraphs", count: 3, classic: true } }] },
};

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

export function lorem(unit: string, count: number, classic: boolean): string {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const word = () => WORDS[Math.floor(rnd() * WORDS.length)];
  const sentence = () => {
    const n = 6 + Math.floor(rnd() * 10);
    const w = Array.from({ length: n }, word);
    const commaAt = n > 8 ? 3 + Math.floor(rnd() * 3) : -1;
    return w.map((x, i) => (i === commaAt ? x + "," : x)).join(" ").replace(/^./, (c) => c.toUpperCase()) + ".";
  };
  const para = () => Array.from({ length: 3 + Math.floor(rnd() * 4) }, sentence).join(" ");
  const n = Math.max(1, Math.floor(count));
  if (unit === "words") {
    const w = Array.from({ length: n }, (_, i) => (classic && i < 5 ? WORDS[i] : word()));
    return w.join(" ").replace(/^./, (c) => c.toUpperCase()) + ".";
  }
  const first = classic ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit." : "";
  if (unit === "sentences") return Array.from({ length: n }, (_, i) => (i === 0 && first ? first : sentence())).join(" ");
  return Array.from({ length: n }, (_, i) => (i === 0 && first ? first + " " + para() : para())).join("\n\n");
}

export const blocks: BlockDef[] = [{
  id: "lorem", name: "Filler text", category: "Generate", description: "Replaces the text with lorem ipsum.",
  params: [sel("unit", "Unit", ["paragraphs", "sentences", "words"]), num("count", "Count", 3, 1, 500), bool("classic", "Start with \"Lorem ipsum\"", true)],
  run: (_i, p) => lorem(String(p.unit), Math.min(500, Number(p.count)), Boolean(p.classic)),
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Input (ignored)", inputRows: 1, outputLabel: "Text", outputName: "filler.txt" });
