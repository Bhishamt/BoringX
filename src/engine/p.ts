import type { ParamDef } from "./types";

export const text = (key: string, label: string, def = "", help?: string): ParamDef => ({ key, label, type: "text", default: def, help });
export const area = (key: string, label: string, def = "", help?: string): ParamDef => ({ key, label, type: "textarea", default: def, help });
export const num = (key: string, label: string, def: number, min?: number, max?: number, help?: string): ParamDef => ({ key, label, type: "number", default: def, min, max, help });
export const bool = (key: string, label: string, def = false, help?: string): ParamDef => ({ key, label, type: "bool", default: def, help });
export const sel = (key: string, label: string, options: (string | [string, string])[], def?: string, help?: string): ParamDef => ({
  key, label, type: "select", help,
  options: options.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o[0], label: o[1] })),
  default: def ?? (typeof options[0] === "string" ? options[0] : options[0][0]),
});
