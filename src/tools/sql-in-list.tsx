import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, sel, text } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "sql-in-list", name: "SQL IN List", category: "Data",
  blurb: "Turns a column of values into an IN (...) clause.",
  description: "Paste a column from a spreadsheet and get a SQL IN list with correct quoting. Handles numbers, strings and apostrophes.",
  keywords: ["sql", "in clause", "list", "where in", "quote", "column"],
  recipe: { name: "SQL IN List", input: "1001\n1002\n1003\n1003\n1004", steps: [{ b: "sql-in-list", p: { column: "id", quote: "auto", dedupe: true, perLine: 0 } }] },
};

export const blocks: BlockDef[] = [{
  id: "sql-in-list", name: "SQL IN list", category: "Data", description: "One value per line becomes IN (...).",
  params: [text("column", "Column (optional)", "id"), sel("quote", "Quoting", [["auto", "Auto (numbers bare)"], ["always", "Always quote"], ["never", "Never quote"]], "auto"), bool("dedupe", "Remove duplicates", true), sel("perLine", "Values per line", [["0", "All on one line"], ["1", "One per line"], ["5", "5 per line"], ["10", "10 per line"]], "0")],
  run: (input, p) => {
    let vals = input.split(/\r?\n|\t/).map((v) => v.trim()).filter(Boolean);
    if (!vals.length) throw new Error("No values found. Put one value per line.");
    if (p.dedupe) vals = [...new Set(vals)];
    const numeric = vals.every((v) => /^-?\d+(\.\d+)?$/.test(v));
    const q = (v: string) => (p.quote === "never" || (p.quote === "auto" && numeric) ? v : `'${v.replace(/'/g, "''")}'`);
    const items = vals.map(q);
    const n = Number(p.perLine);
    const body = n ? items.reduce<string[]>((acc, x, i) => { (i % n ? (acc[acc.length - 1] += `, ${x}`) : acc.push(x)); return acc; }, []).join(",\n  ") : items.join(", ");
    const col = String(p.column).trim();
    return `${col ? col + " " : ""}IN (${n ? "\n  " : ""}${body}${n ? "\n" : ""})`;
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Values, one per line", outputLabel: "SQL", outputName: "in-list.sql" });
