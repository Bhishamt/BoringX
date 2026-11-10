"use client";
import type { ParamDef, ParamValue, Params } from "@/engine/types";

export function ParamControls({ defs, values, onChange, idPrefix }: { defs: ParamDef[]; values: Params; onChange: (p: Params) => void; idPrefix: string }) {
  if (!defs.length) return null;
  const set = (k: string, v: ParamValue) => onChange({ ...values, [k]: v });
  return (
    <div className="params">
      {defs.map((d) => {
        const id = `${idPrefix}-${d.key}`;
        const v = values[d.key] ?? d.default;
        return (
          <div key={d.key} className={`param ${d.type === "textarea" ? "param-wide" : ""}`}>
            <label htmlFor={id} className="field-label">{d.label}</label>
            {d.type === "select" ? (
              <select id={id} value={String(v)} onChange={(e) => set(d.key, e.target.value)}>
                {d.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : d.type === "bool" ? (
              <input id={id} type="checkbox" checked={Boolean(v)} onChange={(e) => set(d.key, e.target.checked)} />
            ) : d.type === "number" ? (
              <input id={id} type="number" className="mono" value={String(v)} min={d.min} max={d.max}
                onChange={(e) => set(d.key, e.target.value === "" ? d.default : Number(e.target.value))} />
            ) : d.type === "textarea" ? (
              <textarea id={id} className="mono" rows={4} spellCheck={false} value={String(v)} onChange={(e) => set(d.key, e.target.value)} />
            ) : (
              <input id={id} type="text" className="mono" spellCheck={false} value={String(v)} onChange={(e) => set(d.key, e.target.value)} />
            )}
            {d.help && <span className="field-help">{d.help}</span>}
          </div>
        );
      })}
    </div>
  );
}
