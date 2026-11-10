// Copies self-hosted heavy assets (OCR, background removal, pdf worker) into public/ so
// nothing is ever fetched from a third-party CDN. Runs before dev and build.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const nm = (p) => path.join(root, "node_modules", p);
const pub = (p) => path.join(root, "public", p);
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) fs.copyFileSync(from, to);
};

copy(nm("pdfjs-dist/build/pdf.worker.min.mjs"), pub("pdf.worker.min.mjs"));

// tesseract: worker, wasm cores, english data
copy(nm("tesseract.js/dist/worker.min.js"), pub("tesseract/worker.min.js"));
for (const f of fs.readdirSync(nm("tesseract.js-core"))) {
  if (f.endsWith("-lstm.wasm.js")) copy(nm("tesseract.js-core/" + f), pub("tesseract/core/" + f));
}
copy(nm("@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"), pub("tesseract/lang/eng.traineddata.gz"));

// background removal: only the files we actually use (small model, cpu wasm)
const dist = nm("@imgly/background-removal-data/dist");
const res = JSON.parse(fs.readFileSync(path.join(dist, "resources.json"), "utf8"));
const keep = [
  "/models/small",
  "/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd.wasm",
];
const out = {};
for (const k of keep) {
  out[k] = res[k];
  for (const c of res[k].chunks) copy(path.join(dist, c.hash), pub("imgly/" + c.hash));
}
fs.mkdirSync(pub("imgly"), { recursive: true });
fs.writeFileSync(pub("imgly/resources.json"), JSON.stringify(out));
console.log("assets copied");
