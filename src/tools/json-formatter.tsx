import type { BlockDef, ToolMeta } from "@/engine/types";
import { bool, sel } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "json-formatter", name: "JSON Formatter", category: "Data",
  blurb: "Formats, minifies and validates JSON, with useful errors.",
  description: "Format, minify and validate JSON in your browser. Error messages point at the line and column.",
  keywords: ["json", "pretty print", "minify", "validate", "beautify"],
  recipe: { name: "JSON Formatter", input: '{"name":"BoringX","tools":[{"id":1,"dull":true},{"id":2,"dull":true}],"nested":{"b":2,"a":1}}', steps: [{ b: "json-format", p: { indent: "2", sortKeys: false } }] },
};

export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const m = msg.match(/position (\d+)/);
    let where = "";
    if (m) {
      const pos = Number(m[1]);
      const before = input.slice(0, pos).split("\n");
      where = ` at line ${before.length}, column ${before[before.length - 1].length + 1}`;
    }
    throw new Error(`Invalid JSON${where}. ${msg.replace(/ in JSON at position.*/, "")}. Check for trailing commas, single quotes, or unquoted keys.`);
  }
}

const sortDeep = (v: unknown): unknown =>
  Array.isArray(v) ? v.map(sortDeep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sortDeep(x)])) : v;

export const blocks: BlockDef[] = [{
  id: "json-format", name: "Format JSON", category: "Data", description: "Validates and re-indents or minifies JSON.",
  params: [sel("indent", "Indent", [["2", "2 spaces"], ["4", "4 spaces"], ["tab", "Tab"], ["min", "Minify"]], "2"), bool("sortKeys", "Sort keys", false)],
  run: (input, p) => {
    if (!input.trim()) throw new Error("Nothing to format. Paste some JSON.");
    let v = parseJson(input);
    if (p.sortKeys) v = sortDeep(v);
    return JSON.stringify(v, null, p.indent === "min" ? 0 : p.indent === "tab" ? "\t" : Number(p.indent));
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "JSON", outputName: "formatted.json", acceptFile: ".json,application/json,.txt", inputRows: 12 });
