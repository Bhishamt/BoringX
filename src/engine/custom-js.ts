/** Runs user code in a dedicated Worker with a hard timeout. */
export function runCustomJs(code: string, input: string, timeoutMs = 2000): Promise<string> {
  if (typeof Worker === "undefined") return Promise.reject(new Error("Workers are not available in this browser."));
  return new Promise((resolve, reject) => {
    const w = new Worker("/workers/custom-js.js");
    const timer = setTimeout(() => {
      w.terminate();
      reject(new Error(`Custom code ran longer than ${timeoutMs / 1000}s and was stopped. Check for an infinite loop.`));
    }, timeoutMs);
    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      e.data.ok ? resolve(e.data.out) : reject(new Error(`Your code threw: ${e.data.error}`));
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      w.terminate();
      reject(new Error(`Your code could not run: ${e.message || "syntax error"}`));
    };
    w.postMessage({ code, input });
  });
}
