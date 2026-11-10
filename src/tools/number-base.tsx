import type { BlockDef, ToolMeta } from "@/engine/types";
import { num } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "number-base", name: "Number Base", category: "Convert",
  blurb: "Binary, octal, decimal, hex and any base to 36. Big numbers too.",
  description: "Convert numbers between binary, octal, decimal, hexadecimal and any base up to 36. Handles arbitrarily large integers.",
  keywords: ["binary", "hex", "octal", "decimal", "base", "convert", "radix"],
  recipe: { name: "Number Base", input: "255\n0xFF\n0b1010\n0o777\n123456789012345678901234567890", steps: [{ b: "number-base", p: { from: 10, custom: 36 } }] },
};

const DIG = "0123456789abcdefghijklmnopqrstuvwxyz";
export function parseBig(s: string, base: number): bigint {
  let t = s.trim().replace(/_/g, "").toLowerCase(), neg = false;
  if (t.startsWith("-")) { neg = true; t = t.slice(1); }
  let b = base;
  if (t.startsWith("0x")) { b = 16; t = t.slice(2); } else if (t.startsWith("0b")) { b = 2; t = t.slice(2); } else if (t.startsWith("0o")) { b = 8; t = t.slice(2); }
  if (!t) throw new Error(`"${s}" has no digits.`);
  let v = 0n; const B = BigInt(b);
  for (const ch of t) {
    const d = DIG.indexOf(ch);
    if (d < 0 || d >= b) throw new Error(`"${ch}" is not a valid digit in base ${b} (in "${s}"). Change the input base or fix the digit.`);
    v = v * B + BigInt(d);
  }
  return neg ? -v : v;
}
export const toBase = (v: bigint, b: number) => (v < 0n ? "-" + (-v).toString(b) : v.toString(b));

export const blocks: BlockDef[] = [{
  id: "number-base", name: "Number base", category: "Convert", description: "Each line: shows the number in several bases. Prefixes 0x, 0b, 0o override the input base.",
  params: [num("from", "Input base (2 to 36)", 10, 2, 36), num("custom", "Extra output base", 36, 2, 36)],
  run: (input, p) => {
    const from = Math.floor(Number(p.from)), custom = Math.floor(Number(p.custom));
    if (!(from >= 2 && from <= 36 && custom >= 2 && custom <= 36)) throw new Error("Bases must be between 2 and 36.");
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Enter a number.");
    return lines.map((l) => {
      const v = parseBig(l, from);
      return [`${l}`, `  bin  ${toBase(v, 2)}`, `  oct  ${toBase(v, 8)}`, `  dec  ${toBase(v, 10)}`, `  hex  ${toBase(v, 16)}`, `  b${custom}`.padEnd(7) + toBase(v, custom)].join("\n");
    }).join("\n\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Numbers, one per line", outputName: "bases.txt", inputRows: 5 });
