import { canvasToBlob } from "./util";

/** Small generated files so every file tool opens in a working state. */
export async function samplePdf(title = "Sample", pages = 3): Promise<File> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  for (let i = 1; i <= pages; i++) {
    const p = doc.addPage([420, 595]);
    p.drawText(`${title}`, { x: 40, y: 520, size: 24, font, color: rgb(0.12, 0.25, 0.66) });
    p.drawText(`Page ${i} of ${pages}`, { x: 40, y: 480, size: 14, font });
    p.drawText("Nothing exciting happens here.", { x: 40, y: 450, size: 12, font });
    p.drawLine({ start: { x: 40, y: 430 }, end: { x: 380, y: 430 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  }
  return new File([new Uint8Array(await doc.save()) as unknown as BlobPart], `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`, { type: "application/pdf" });
}

export async function sampleImage(label = "Sample", w = 640, h = 400, type: "image/png" | "image/jpeg" = "image/png", hue = 225): Promise<File> {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = `hsl(${hue} 25% 88%)`; g.fillRect(0, 0, w, h);
  g.strokeStyle = `hsl(${hue} 30% 55%)`; g.lineWidth = 2;
  for (let y = 40; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = `hsl(${hue} 70% 35%)`; g.beginPath(); g.arc(w * 0.5, h * 0.45, Math.min(w, h) * 0.22, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff"; g.font = `bold ${Math.round(h * 0.2)}px monospace`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("B", w * 0.5, h * 0.45);
  g.fillStyle = "#222"; g.font = `${Math.round(h * 0.06)}px monospace`; g.fillText(label, w / 2, h * 0.88);
  const ext = type === "image/png" ? "png" : "jpg";
  return new File([await canvasToBlob(c, type, 0.92)], `${label.toLowerCase().replace(/\s+/g, "-")}.${ext}`, { type });
}

export async function sampleTextImage(): Promise<File> {
  const c = document.createElement("canvas"); c.width = 900; c.height = 260;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#111"; g.font = "bold 44px sans-serif"; g.textBaseline = "top";
  g.fillText("Nothing exciting happens here.", 40, 50);
  g.font = "32px sans-serif"; g.fillText("Invoice 2026-0042   Total: $120.00", 40, 140);
  return new File([await canvasToBlob(c, "image/png")], "ocr-sample.png", { type: "image/png" });
}

export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <rect width="320" height="200" fill="#e9e8e4"/>
  <rect x="20" y="20" width="280" height="160" fill="none" stroke="#1f3fa8" stroke-width="3"/>
  <line x1="20" y1="70" x2="300" y2="70" stroke="#1f3fa8" stroke-width="1"/>
  <line x1="20" y1="120" x2="300" y2="120" stroke="#1f3fa8" stroke-width="1"/>
  <text x="160" y="52" font-family="monospace" font-size="22" text-anchor="middle" fill="#1c1c1a">BORING</text>
</svg>`;
