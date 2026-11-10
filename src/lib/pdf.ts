import { canvasToBlob } from "./util";

export async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

export async function openPdf(file: File | Blob) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    return await pdfjs.getDocument({ data }).promise;
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "PasswordException") throw new Error("This PDF is password protected. Remove the password first, then try again.");
    throw new Error("This file could not be read as a PDF. It may be damaged or not a PDF.");
  }
}

export async function renderPageToBlob(doc: Awaited<ReturnType<typeof openPdf>>, pageNo: number, scale: number, type: "image/png" | "image/jpeg", quality = 0.9): Promise<{ blob: Blob; width: number; height: number }> {
  const page = await doc.getPage(pageNo);
  const vp = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, canvas: c, viewport: vp }).promise;
  const blob = await canvasToBlob(c, type, quality);
  page.cleanup();
  return { blob, width: c.width, height: c.height };
}

/** "1-3, 5, 8-" to zero-based index list. */
export function parseRanges(spec: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const part of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/) ?? part.match(/^(\d+)$/);
    if (!m) throw new Error(`"${part}" is not a page range. Use numbers like 1-3, 5, 8-.`);
    let a: number, b: number;
    if (m.length === 2) a = b = Number(m[1]);
    else { a = m[1] ? Number(m[1]) : 1; b = m[2] ? Number(m[2]) : total; }
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside this document, which has ${total} page${total === 1 ? "" : "s"}.`);
    groups.push(Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
  }
  if (!groups.length) throw new Error("Enter at least one page range, for example 1-3, 5.");
  return groups;
}
