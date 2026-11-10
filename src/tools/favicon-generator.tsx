import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { AsyncDownloadBtn, CopyBtn, ErrorNote, FileDrop, Panel, useObjectUrl } from "@/components/kit";
import { sampleImage } from "@/lib/samples";
import { canvasToBlob, loadImage } from "@/lib/util";
import { zipBlobs } from "@/lib/zip";

export const meta: ToolMeta = {
  slug: "favicon-generator", name: "Favicon Generator", category: "Files",
  blurb: "One image in; favicon.ico, PNG sizes, touch icon and HTML out.",
  description: "Generate a complete favicon set from one image in your browser: favicon.ico, 16/32/48 PNG, Apple touch icon, Android icons and the HTML tags.",
  keywords: ["favicon", "icon", "ico", "apple touch icon", "pwa", "generate"],
};

const SIZES = [16, 32, 48, 180, 192, 512];
async function square(img: HTMLImageElement, n: number): Promise<Blob> {
  const c = document.createElement("canvas"); c.width = c.height = n;
  const ctx = c.getContext("2d")!; ctx.imageSmoothingQuality = "high";
  const s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2;
  ctx.drawImage(img, sx, sy, s, s, 0, 0, n, n);
  return canvasToBlob(c, "image/png");
}
/** ICO container with PNG-compressed entries (supported by all current browsers). */
export async function buildIco(pngs: { size: number; data: Uint8Array }[]): Promise<Blob> {
  const head = new Uint8Array(6 + 16 * pngs.length);
  const dv = new DataView(head.buffer);
  dv.setUint16(2, 1, true); dv.setUint16(4, pngs.length, true);
  let off = head.length;
  pngs.forEach((p, i) => { const o = 6 + i * 16; head[o] = p.size >= 256 ? 0 : p.size; head[o + 1] = p.size >= 256 ? 0 : p.size; dv.setUint16(o + 4, 1, true); dv.setUint16(o + 6, 32, true); dv.setUint32(o + 8, p.data.length, true); dv.setUint32(o + 12, off, true); off += p.data.length; });
  return new Blob([head as unknown as BlobPart, ...pngs.map((p) => p.data as unknown as BlobPart)], { type: "image/x-icon" });
}

const HTML = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
const MANIFEST = JSON.stringify({ name: "", short_name: "", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }], display: "standalone" }, null, 2);

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const url = useObjectUrl(file);
  useEffect(() => { sampleImage("Favicon", 512, 512, "image/png", 225).then(setFile); }, []);

  const make = async () => {
    if (!file) throw new Error("Choose an image first.");
    const img = await loadImage(file);
    if (Math.min(img.naturalWidth, img.naturalHeight) < 192) setErr("This image is small. Icons look best from a square image of 512 pixels or more.");
    const blobs = new Map<number, Blob>();
    for (const s of SIZES) blobs.set(s, await square(img, s));
    const ico = await buildIco(await Promise.all([16, 32, 48].map(async (s) => ({ size: s, data: new Uint8Array(await blobs.get(s)!.arrayBuffer()) }))));
    return zipBlobs([
      { name: "favicon.ico", data: ico }, { name: "favicon-16.png", data: blobs.get(16)! }, { name: "favicon-32.png", data: blobs.get(32)! },
      { name: "apple-touch-icon.png", data: blobs.get(180)! }, { name: "icon-192.png", data: blobs.get(192)! }, { name: "icon-512.png", data: blobs.get(512)! },
      { name: "site.webmanifest", data: MANIFEST }, { name: "head.html", data: HTML + "\n" },
    ], 6);
  };

  return (
    <div className="stack">
      <Panel title="Image"><FileDrop multiple={false} accept="image/*" onFiles={(f) => { setFile(f[0]); setErr(null); }} hint="The centre square is used." />{url && /* eslint-disable-next-line @next/next/no-img-element */ <img className="preview-img" style={{ maxWidth: 160 }} src={url} alt="Source" />}</Panel>
      <Panel title="Icon set" actions={<AsyncDownloadBtn primary label="Download favicons.zip" name="favicons.zip" make={make} />}>
        <ErrorNote error={err} />
        <ul className="ledger">{["favicon.ico (16, 32, 48)", "favicon-16.png, favicon-32.png", "apple-touch-icon.png (180)", "icon-192.png, icon-512.png", "site.webmanifest, head.html"].map((x) => <li className="ledger-row mono" key={x}>{x}</li>)}</ul>
      </Panel>
      <Panel title="HTML" actions={<CopyBtn text={HTML} />}><pre className="mono text-out">{HTML}</pre></Panel>
    </div>
  );
}
