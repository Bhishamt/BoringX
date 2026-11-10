import type { BlockDef, Step } from "./types";
import { defaultParams } from "./types";

export type StepResult = { ok: true; out: string; ms: number } | { ok: false; error: string; ms: number };

/** Runs a pipeline. Stops at the first failing step; later steps are skipped. */
export async function runPipeline(
  input: string,
  steps: Step[],
  lookup: (id: string) => BlockDef | undefined,
): Promise<{ results: StepResult[]; output: string; error?: { index: number; message: string } }> {
  let cur = input;
  const results: StepResult[] = [];
  for (let i = 0; i < steps.length; i++) {
    const def = lookup(steps[i].b);
    const t = performance.now();
    if (!def) {
      const message = `Unknown block "${steps[i].b}". Remove it and add another.`;
      results.push({ ok: false, error: message, ms: 0 });
      return { results, output: cur, error: { index: i, message } };
    }
    try {
      cur = await def.run(cur, { ...defaultParams(def), ...steps[i].p });
      results.push({ ok: true, out: cur, ms: performance.now() - t });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ ok: false, error: message, ms: performance.now() - t });
      return { results, output: cur, error: { index: i, message } };
    }
  }
  return { results, output: cur };
}
