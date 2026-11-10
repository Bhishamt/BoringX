import type { BlockDef, ToolMeta } from "@/engine/types";
import { toolFromRecipe } from "@/components/toolFromRecipe";

export const meta: ToolMeta = {
  slug: "color", name: "Color", category: "Convert",
  blurb: "HEX, RGB, HSL and OKLCH, with contrast ratios.",
  description: "Convert colours between HEX, RGB, HSL and OKLCH, and check contrast against white and black (WCAG).",
  keywords: ["color", "colour", "hex", "rgb", "hsl", "oklch", "contrast"],
  recipe: { name: "Color", input: "#1f3fa8", steps: [{ b: "color", p: {} }] },
};

type RGB = [number, number, number];
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklch([r, g, b]: RGB): [number, number, number] {
  const [lr, lg, lb] = [lin(r / 255), lin(g / 255), lin(b / 255)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  return [L, C, C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
export function oklchToRgb(L: number, C: number, h: number): RGB {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return rgb.map((c) => Math.round(clamp(gam(clamp(c))) * 255)) as RGB;
}
export function rgbToHsl([r, g, b]: RGB): RGB {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn, l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === R ? ((G - B) / d + (G < B ? 6 : 0)) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s * 100, l * 100];
}
export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255)) as RGB;
}
const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000", red: "#ff0000", green: "#008000", blue: "#0000ff", yellow: "#ffff00", orange: "#ffa500", purple: "#800080", grey: "#808080", gray: "#808080", pink: "#ffc0cb", teal: "#008080", navy: "#000080" };

export function parseColor(s: string): RGB {
  let t = s.trim().toLowerCase();
  if (NAMED[t]) t = NAMED[t];
  let m = t.match(/^#?([0-9a-f]{3,8})$/);
  if (m && [3, 4, 6, 8].includes(m[1].length)) {
    let h = m[1]; if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
  }
  const nums = (x: string) => (x.match(/-?\d*\.?\d+%?/g) ?? []).map((n) => (n.endsWith("%") ? parseFloat(n) / 100 : parseFloat(n)));
  const pct = (x: string) => x.match(/%/g)?.length ?? 0;
  if ((m = t.match(/^rgba?\((.*)\)$/))) { const n = nums(m[1]); const p = pct(m[1]) >= 3; return [n[0], n[1], n[2]].map((v) => Math.round(clamp(p ? v : v / 255) * 255)) as RGB; }
  if ((m = t.match(/^hsla?\((.*)\)$/))) { const n = nums(m[1]); return hslToRgb(n[0], n[1] * 100, n[2] * 100); }
  if ((m = t.match(/^oklch\((.*)\)$/))) { const n = m[1].split(/[\s,/]+/).filter(Boolean); const L = n[0].endsWith("%") ? parseFloat(n[0]) / 100 : parseFloat(n[0]); return oklchToRgb(L, parseFloat(n[1]), parseFloat(n[2])); }
  throw new Error(`Could not read "${s}". Try #1f3fa8, rgb(31 63 168), hsl(225 69% 38%) or oklch(0.42 0.17 264).`);
}
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const contrast = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const r1 = (n: number, d = 1) => String(Number(n.toFixed(d)));

export function describe(c: RGB): string {
  const hex = "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
  const [h, s, l] = rgbToHsl(c); const [L, C, H] = rgbToOklch(c);
  const cw = contrast(c, [255, 255, 255]), cb = contrast(c, [0, 0, 0]);
  const grade = (x: number) => (x >= 7 ? "AAA" : x >= 4.5 ? "AA" : x >= 3 ? "AA large only" : "fails");
  return [`HEX    ${hex}`, `RGB    rgb(${c.join(" ")})`, `HSL    hsl(${r1(h)} ${r1(s)}% ${r1(l)}%)`, `OKLCH  oklch(${r1(L, 3)} ${r1(C, 3)} ${r1(H)})`, "", `On white: ${r1(cw, 2)}:1 ${grade(cw)}`, `On black: ${r1(cb, 2)}:1 ${grade(cb)}`].join("\n");
}

export const blocks: BlockDef[] = [{
  id: "color", name: "Color", category: "Convert", description: "Describes the first line's colour in every format.", params: [],
  run: (input) => {
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) throw new Error("Enter a colour like #1f3fa8.");
    return lines.map((l) => (lines.length > 1 ? `${l}\n` : "") + describe(parseColor(l))).join("\n\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, {
  inputLabel: "Colour (any format)", outputLabel: "Formats", outputName: "color.txt", inputRows: 2,
  renderOutput: (out) => {
    const hex = out.match(/HEX\s+(#[0-9a-f]{6})/)?.[1] ?? "#000";
    return (
      <div className="swatch-wrap">
        <div className="swatch" style={{ background: hex }} role="img" aria-label={`Swatch ${hex}`} />
        <pre className="mono">{out}</pre>
      </div>
    );
  },
});
