import type { Category, ToolMeta } from "@/engine/types";
import { CATEGORIES } from "@/engine/types";
import data from "@/generated/tools.json";

export const tools = data as ToolMeta[];
export const toolBySlug = (s: string) => tools.find((t) => t.slug === s);
export const byCategory = () => CATEGORIES.map((c) => ({ category: c as Category, tools: tools.filter((t) => t.category === c) }));
export const SITE = { name: "BoringX", url: "https://boringx.vercel.app", tagline: "Small tools that each do one dull job." };

/** Score a tool against a query; 0 means no match. */
export function score(t: ToolMeta, q: string): number {
  const s = q.trim().toLowerCase();
  if (!s) return 1;
  const name = t.name.toLowerCase();
  if (name === s) return 100;
  if (name.startsWith(s)) return 80;
  if (name.includes(s)) return 60;
  if (t.keywords.some((k) => k.includes(s))) return 40;
  if (t.blurb.toLowerCase().includes(s) || t.category.toLowerCase() === s) return 20;
  const words = s.split(/\s+/);
  if (words.length > 1 && words.every((w) => name.includes(w) || t.keywords.some((k) => k.includes(w)))) return 30;
  return 0;
}
