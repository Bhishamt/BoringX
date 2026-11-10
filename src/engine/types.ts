export type Category =
  | "PDF" | "Image" | "Text" | "Data" | "Dev" | "Generate" | "Convert" | "Files";

export const CATEGORIES: Category[] = ["PDF", "Image", "Text", "Data", "Dev", "Generate", "Convert", "Files"];

export type ParamValue = string | number | boolean;
export type Params = Record<string, ParamValue>;

export type ParamDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "bool" | "textarea";
  default: ParamValue;
  options?: { value: string; label: string }[];
  help?: string;
  min?: number;
  max?: number;
};

export type BlockDef = {
  id: string;
  name: string;
  category: Category;
  description: string;
  params: ParamDef[];
  /** Pure text-in, text-out. Throw Error with a human message to report a problem. */
  run: (input: string, params: Params) => string | Promise<string>;
};

export type Step = { b: string; p: Params };
export type Recipe = { name: string; input: string; steps: Step[] };

export type ToolMeta = {
  slug: string;
  name: string;
  category: Category;
  /** one dry line shown in the ledger */
  blurb: string;
  /** SEO description */
  description: string;
  keywords: string[];
  /** Needs its own, slightly looser CSP header (see vercel.json), so links to it do a full page load. */
  hardNav?: boolean;
  /** If present, the tool can be taken apart into these blocks. */
  recipe?: Recipe;
};

export const defaultParams = (b: BlockDef): Params =>
  Object.fromEntries(b.params.map((p) => [p.key, p.default]));
