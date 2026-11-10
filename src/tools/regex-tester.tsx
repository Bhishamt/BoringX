import type { BlockDef, ToolMeta } from "@/engine/types";
import { sel, text } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "regex-tester", name: "Regex Tester", category: "Dev",
  blurb: "Tests a JavaScript regex against text. Lists matches or replaces.",
  description: "Test JavaScript regular expressions live: see every match with index and capture groups, or run a replace.",
  keywords: ["regex", "regular expression", "match", "replace", "javascript", "test"],
  recipe: { name: "Regex Tester", input: "ada@example.com, grace@navy.mil, not-an-email, linus@kernel.org", steps: [{ b: "regex", p: { pattern: "(\\w+)@([\\w.]+)", flags: "g", mode: "matches", replacement: "$2: $1" } }] },
};

export const blocks: BlockDef[] = [{
  id: "regex", name: "Regex", category: "Dev", description: "List matches or replace with a JavaScript regex.",
  params: [text("pattern", "Pattern", "\\w+"), text("flags", "Flags", "g", "g i m s u y"), sel("mode", "Mode", [["matches", "List matches"], ["replace", "Replace"], ["test", "Keep matching lines"]]), text("replacement", "Replacement", "$&", "Use $1, $2, $& for groups.")],
  run: (input, p) => {
    const pattern = String(p.pattern);
    if (!pattern) throw new Error("Enter a pattern.");
    let re: RegExp;
    try { re = new RegExp(pattern, String(p.flags)); } catch (e) { throw new Error(`Invalid regex: ${e instanceof Error ? e.message : e}`); }
    if (p.mode === "replace") return input.replace(re, String(p.replacement));
    if (p.mode === "test") { const r = new RegExp(pattern, String(p.flags).replace(/[gy]/g, "")); return input.split("\n").filter((l) => r.test(l)).join("\n"); }
    const all = re.global ? [...input.matchAll(re)] : ((m) => (m ? [m] : []))(re.exec(input));
    if (!all.length) return "No matches.";
    return `${all.length} match${all.length === 1 ? "" : "es"}\n\n` + all.slice(0, 500).map((m, i) => {
      const groups = m.slice(1).map((g, j) => `    $${j + 1} = ${g === undefined ? "(unset)" : JSON.stringify(g)}`);
      const named = m.groups ? Object.entries(m.groups).map(([k, v]) => `    ${k} = ${JSON.stringify(v)}`) : [];
      return [`#${i + 1} at ${m.index}: ${JSON.stringify(m[0])}`, ...groups, ...named].join("\n");
    }).join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { outputLabel: "Result", outputName: "regex.txt", inputRows: 6 });
