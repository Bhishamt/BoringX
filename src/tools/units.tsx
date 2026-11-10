import type { BlockDef, ToolMeta } from "@/engine/types";
import { num } from "@/engine/p";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "units", name: "Units", category: "Convert",
  blurb: "Length, mass, volume, speed, area, data, time and temperature.",
  description: "Convert units of length, mass, volume, area, speed, data size, time and temperature. Write '10 km to mi' or just '10 km' to see every unit.",
  keywords: ["units", "convert", "metric", "imperial", "length", "weight", "temperature"],
  recipe: { name: "Units", input: "10 km to mi\n72 f to c\n5 lb to kg\n1 gb to mb\n100 km/h to mph\n2 cups", steps: [{ b: "units", p: { precision: 6 } }] },
};

type U = { to: number; names: string[] }; // factor to base unit
const D: Record<string, Record<string, U>> = {
  length: { m: { to: 1, names: ["m", "meter", "meters", "metre", "metres"] }, km: { to: 1000, names: ["km", "kilometer", "kilometers"] }, cm: { to: 0.01, names: ["cm"] }, mm: { to: 0.001, names: ["mm"] }, mi: { to: 1609.344, names: ["mi", "mile", "miles"] }, yd: { to: 0.9144, names: ["yd", "yard", "yards"] }, ft: { to: 0.3048, names: ["ft", "foot", "feet"] }, in: { to: 0.0254, names: ["in", "inch", "inches"] }, nmi: { to: 1852, names: ["nmi"] } },
  mass: { kg: { to: 1, names: ["kg", "kilogram", "kilograms"] }, g: { to: 0.001, names: ["g", "gram", "grams"] }, mg: { to: 1e-6, names: ["mg"] }, t: { to: 1000, names: ["t", "tonne", "tonnes"] }, lb: { to: 0.45359237, names: ["lb", "lbs", "pound", "pounds"] }, oz: { to: 0.028349523125, names: ["oz", "ounce", "ounces"] }, st: { to: 6.35029318, names: ["st", "stone"] } },
  volume: { l: { to: 1, names: ["l", "liter", "liters", "litre", "litres"] }, ml: { to: 0.001, names: ["ml"] }, gal: { to: 3.785411784, names: ["gal", "gallon", "gallons"] }, qt: { to: 0.946352946, names: ["qt", "quart", "quarts"] }, pt: { to: 0.473176473, names: ["pt", "pint", "pints"] }, cup: { to: 0.2365882365, names: ["cup", "cups"] }, floz: { to: 0.0295735295625, names: ["floz", "fl oz"] }, tbsp: { to: 0.01478676478125, names: ["tbsp"] }, tsp: { to: 0.00492892159375, names: ["tsp"] } },
  area: { m2: { to: 1, names: ["m2", "sqm"] }, km2: { to: 1e6, names: ["km2"] }, ha: { to: 1e4, names: ["ha", "hectare", "hectares"] }, ft2: { to: 0.09290304, names: ["ft2", "sqft"] }, ac: { to: 4046.8564224, names: ["ac", "acre", "acres"] }, mi2: { to: 2589988.110336, names: ["mi2", "sqmi"] } },
  speed: { "m/s": { to: 1, names: ["m/s", "mps"] }, "km/h": { to: 1 / 3.6, names: ["km/h", "kph", "kmh"] }, mph: { to: 0.44704, names: ["mph", "mi/h"] }, kn: { to: 0.514444444, names: ["kn", "knot", "knots"] }, "ft/s": { to: 0.3048, names: ["ft/s", "fps"] } },
  data: { b: { to: 1, names: ["b", "byte", "bytes"] }, kb: { to: 1e3, names: ["kb"] }, mb: { to: 1e6, names: ["mb"] }, gb: { to: 1e9, names: ["gb"] }, tb: { to: 1e12, names: ["tb"] }, kib: { to: 1024, names: ["kib"] }, mib: { to: 1048576, names: ["mib"] }, gib: { to: 1073741824, names: ["gib"] }, tib: { to: 1099511627776, names: ["tib"] }, bit: { to: 0.125, names: ["bit", "bits"] } },
  time: { s: { to: 1, names: ["s", "sec", "second", "seconds"] }, ms: { to: 0.001, names: ["ms"] }, min: { to: 60, names: ["min", "minute", "minutes"] }, h: { to: 3600, names: ["h", "hr", "hour", "hours"] }, d: { to: 86400, names: ["d", "day", "days"] }, wk: { to: 604800, names: ["wk", "week", "weeks"] }, yr: { to: 31557600, names: ["yr", "year", "years"] } },
};
const TEMPS = ["c", "f", "k"];

type Found = { dim: string; key: string } | null;
function find(name: string): Found {
  const n = name.toLowerCase().replace(/\s+/g, " ");
  if (["c", "°c", "celsius"].includes(n)) return { dim: "temperature", key: "c" };
  if (["f", "°f", "fahrenheit"].includes(n)) return { dim: "temperature", key: "f" };
  if (["k", "kelvin"].includes(n)) return { dim: "temperature", key: "k" };
  for (const [dim, us] of Object.entries(D)) for (const [key, u] of Object.entries(us)) if (u.names.includes(n)) return { dim, key };
  return null;
}
const toC = (v: number, k: string) => (k === "c" ? v : k === "f" ? ((v - 32) * 5) / 9 : v - 273.15);
const fromC = (v: number, k: string) => (k === "c" ? v : k === "f" ? (v * 9) / 5 + 32 : v + 273.15);
function conv(v: number, a: Found & object, b: Found & object): number {
  if (a.dim === "temperature") return fromC(toC(v, a.key), b.key);
  return (v * D[a.dim][a.key].to) / D[a.dim][b.key].to;
}
const fmt = (n: number, p: number) => (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-6 && n !== 0) ? n.toExponential(p) : String(Number(n.toPrecision(p))));

export const blocks: BlockDef[] = [{
  id: "units", name: "Units", category: "Convert", description: "One conversion per line: '10 km to mi'.",
  params: [num("precision", "Significant digits", 6, 1, 12)],
  run: (input, p) => {
    const prec = Number(p.precision);
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Write a conversion like '10 km to mi'.");
    return lines.map((l) => {
      const m = l.match(/^(-?[\d.,]+(?:e[+-]?\d+)?)\s*([^\d\s].*?)(?:\s+(?:to|in|as|->)\s+(.+))?$/i);
      if (!m) return `${l}\n  Write it like '10 km to mi'.`;
      const v = Number(m[1].replace(/,/g, ""));
      const a = find(m[2]);
      if (!a) return `${l}\n  Unknown unit "${m[2]}".`;
      if (m[3]) {
        const b = find(m[3]);
        if (!b) return `${l}\n  Unknown unit "${m[3]}".`;
        if (a.dim !== b.dim) return `${l}\n  Cannot convert ${a.dim} to ${b.dim}.`;
        return `${m[1]} ${m[2]} = ${fmt(conv(v, a, b), prec)} ${m[3]}`;
      }
      const keys = a.dim === "temperature" ? TEMPS : Object.keys(D[a.dim]);
      return `${m[1]} ${m[2]}\n` + keys.filter((k) => k !== a.key).map((k) => `  = ${fmt(conv(v, a, { dim: a.dim, key: k }), prec)} ${k}`).join("\n");
    }).join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Conversions, one per line", outputName: "units.txt", inputRows: 6 });
