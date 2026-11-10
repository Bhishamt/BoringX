// Sandboxed worker for the Custom JavaScript block.
// Served with its own CSP (connect-src 'none') so user code cannot reach the network.
function runUserCode(code, input) {
  const fn = new Function("input", '"use strict";\n' + code);
  const out = fn(input);
  if (out === undefined || out === null) return "";
  if (typeof out === "string") return out;
  if (typeof out === "object") return JSON.stringify(out, null, 2);
  return String(out);
}
if (typeof self !== "undefined" && typeof self.postMessage === "function" && typeof module === "undefined") {
  self.onmessage = (e) => {
    try {
      Promise.resolve(runUserCode(e.data.code, e.data.input)).then(
        (out) => self.postMessage({ ok: true, out }),
        (err) => self.postMessage({ ok: false, error: String((err && err.message) || err) }),
      );
    } catch (err) {
      self.postMessage({ ok: false, error: String((err && err.message) || err) });
    }
  };
}
if (typeof module !== "undefined") module.exports = { runUserCode };
