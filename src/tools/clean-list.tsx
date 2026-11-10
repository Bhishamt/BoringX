import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "clean-list", name: "Clean List", category: "Text",
  blurb: "Trim, remove blanks, dedupe and sort a list of lines.",
  description: "Clean a list: trim whitespace, remove empty lines, remove duplicates, and sort alphabetically, numerically or by length.",
  keywords: ["dedupe", "sort", "unique", "trim", "lines", "remove duplicates"],
  recipe: { name: "Clean List", input: "  banana\napple\n\nBanana\ncherry  \napple\n10\n9", steps: [{ b: "clean-list", p: { trim: true, empty: true, dedupe: true, ignoreCase: true, sort: "az" } }] },
};

export const blocks: BlockDef[] = [{
  id: "clean-list", name: "Clean list", category: "Text", description: "Trim, drop blanks, dedupe, sort lines.",
  params: [bool("trim", "Trim each line", true), bool("empty", "Remove empty lines", true), bool("dedupe", "Remove duplicates", true), bool("ignoreCase", "Ignore case when comparing", false),
    sel("sort", "Sort", [["none", "Keep order"], ["az", "A to Z"], ["za", "Z to A"], ["num", "Numeric"], ["len", "By length"], ["reverse", "Reverse order"]], "none")],
  run: (input, p) => {
    let lines = input.split(/\r?\n/);
    if (p.trim) lines = lines.map((l) => l.trim());
    if (p.empty) lines = lines.filter((l) => l !== "");
    if (p.dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => { const k = p.ignoreCase ? l.toLowerCase() : l; if (seen.has(k)) return false; seen.add(k); return true; });
    }
    const coll = new Intl.Collator(undefined, { sensitivity: "base", numeric: false });
    switch (p.sort) {
      case "az": lines.sort((a, b) => coll.compare(a, b)); break;
      case "za": lines.sort((a, b) => coll.compare(b, a)); break;
      case "num": lines.sort((a, b) => parseFloat(a) - parseFloat(b) || coll.compare(a, b)); break;
      case "len": lines.sort((a, b) => a.length - b.length); break;
      case "reverse": lines.reverse(); break;
    }
    return lines.join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputName: "list.txt" });
