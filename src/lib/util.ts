export const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;

export function download(data: Blob | string, name: string, type = "application/octet-stream") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const baseName = (n: string) => n.replace(/\.[^.]+$/, "");

export function errMsg(e: unknown, fallback = "Something went wrong."): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export async function readText(f: File): Promise<string> {
  return await f.text();
}

export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This file could not be read as an image. Check that it is a PNG, JPG, WebP, GIF or SVG."));
    img.src = url;
  });
}

export function canvasToBlob(c: HTMLCanvasElement | OffscreenCanvas, type: string, q?: number): Promise<Blob> {
  if ("convertToBlob" in c) return c.convertToBlob({ type, quality: q });
  return new Promise((res, rej) =>
    c.toBlob((b) => (b && b.type === type ? res(b) : rej(new Error(`This browser cannot encode ${type}.`))), type, q),
  );
}

export async function imageToCanvas(f: Blob, maxDim?: number, background?: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(f);
  let w = img.naturalWidth, h = img.naturalHeight;
  if (!w || !h) throw new Error("This image has no size. SVGs need width and height attributes.");
  if (maxDim && Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);
  return c;
}
export const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" };
