import type { BlockDef, ToolMeta } from "@/engine/types";
import { area, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "diff", name: "Diff", category: "Text",
  blurb: "Shows what changed between two pieces of text.",
  description: "Compare two texts and see added and removed lines, words or characters. Runs in your browser, nothing is uploaded.",
  keywords: ["compare", "difference", "changes", "text diff"],
  recipe: {
    name: "Diff",
    input: "one\ntwo\nthree\nfour",
    steps: [{ b: "diff", p: { other: "one\n2\nthree\nfour\nfive", mode: "lines" } }],
  },
};

export const blocks: BlockDef[] = [{
  id: "diff", name: "Diff against", category: "Text",
  description: "Compares the input (original) with the text in the setting (changed). Lines start with + added, - removed.",
  params: [area("other", "Changed text", "", "The input is the original. Paste the new version here."), sel("mode", "Compare by", [["lines", "Lines"], ["words", "Words"], ["chars", "Characters"]])],
  run: async (input, p) => {
    const D = await import("diff");
    const mode = String(p.mode);
    const parts = mode === "words" ? D.diffWords(input, String(p.other)) : mode === "chars" ? D.diffChars(input, String(p.other)) : D.diffLines(input, String(p.other));
    if (mode === "lines") {
      return parts.flatMap((x) => {
        const mark = x.added ? "+ " : x.removed ? "- " : "  ";
        return x.value.replace(/\n$/, "").split("\n").map((l) => mark + l);
      }).join("\n");
    }
    return parts.map((x) => (x.added ? `[+${x.value}+]` : x.removed ? `[-${x.value}-]` : x.value)).join("");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, {
  inputLabel: "Original", outputLabel: "Differences", outputName: "diff.txt", inputRows: 8,
  renderOutput: (out) => (
    <pre className="mono diff">{out.split("\n").map((l, i) => (
      <span key={i} className={l.startsWith("+ ") ? "diff-add" : l.startsWith("- ") ? "diff-del" : ""}>{l + "\n"}</span>
    ))}</pre>
  ),
});
