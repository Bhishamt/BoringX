import type { BlockDef, ToolMeta } from "@/engine/types";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "word-count", name: "Word Count", category: "Text",
  blurb: "Counts words, characters, sentences and reading time.",
  description: "Count words, characters, sentences, paragraphs and reading time. Runs in your browser, nothing is uploaded.",
  keywords: ["words", "characters", "count", "length", "reading time"],
  recipe: {
    name: "Word Count",
    input: "The quick brown fox jumps over the lazy dog. Nothing exciting happens here.\n\nA second paragraph, for counting purposes.",
    steps: [{ b: "word-count", p: {} }],
  },
};

export function countText(s: string) {
  const words = (s.match(/\S+/g) ?? []).length;
  const sentences = (s.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []).filter((x) => x.trim()).length;
  const paragraphs = s.split(/\n\s*\n/).filter((x) => x.trim()).length;
  return {
    words,
    characters: [...s].length,
    charactersNoSpaces: [...s.replace(/\s/g, "")].length,
    sentences,
    paragraphs,
    lines: s === "" ? 0 : s.split("\n").length,
    readingMinutes: words / 238,
  };
}

export const blocks: BlockDef[] = [{
  id: "word-count", name: "Word count", category: "Text", description: "Counts words, characters, sentences, paragraphs.", params: [],
  run: (input) => {
    const c = countText(input);
    const mins = c.readingMinutes;
    return [
      `Words:                ${c.words}`,
      `Characters:           ${c.characters}`,
      `Characters (no space):${" "}${c.charactersNoSpaces}`,
      `Sentences:            ${c.sentences}`,
      `Paragraphs:           ${c.paragraphs}`,
      `Lines:                ${c.lines}`,
      `Reading time:         ${mins < 1 ? "under a minute" : `${Math.ceil(mins)} min`}`,
    ].join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputLabel: "Counts", outputName: "counts.txt" });
