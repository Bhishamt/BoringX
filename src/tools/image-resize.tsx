import { useEffect, useMemo, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { AsyncDownloadBtn, ErrorNote, Field, FileDrop, Panel } from "@/components/kit";
import { sampleImage } from "@/lib/samples";
import { EXT, baseName, canvasToBlob, loadImage } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "image-resize", name: "Image Resize and Crop", category: "Image",
  blurb: "Set a size, pick an aspect ratio, crop, save.",
  description: "Resize and crop images in your browser: exact pixels or percent, aspect-ratio crops with adjustable position, PNG/JPG/WebP output. No upload.",
  keywords: ["image", "resize", "crop", "scale", "dimensions", "aspect ratio"],
};

const RATIOS: Record<string, number | null> = { free: null, "1:1": 1, "4:3": 4 / 3, "3:2": 3 / 2, "16:9": 16 / 9, "9:16": 9 / 16, "4:5": 4 / 5 };

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState("free");
  const [px, setPx] = useState(50), [py, setPy] = useState(50);
  const [w, setW] = useState(0), [h, setH] = useState(0);
  const [lock, setLock] = useState(true);
  const [fmt, setFmt] = useState("image/png");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { sampleImage("Sample", 800, 520, "image/png", 225).then(setFile); }, []);
  useEffect(() => { if (!file) return; setErr(null); loadImage(file).then((i) => { setImg(i); setW(i.naturalWidth); setH(i.naturalHeight); }).catch((e) => setErr(e.message)); }, [file]);

  const crop = useMemo(() => {
    if (!img) return null;
    const R = RATIOS[ratio]; const iw = img.naturalWidth, ih = img.naturalHeight;
    let cw = iw, ch = ih;
    if (R) { if (iw / ih > R) cw = Math.round(ih * R); else ch = Math.round(iw / R); }
    return { x: Math.round((iw - cw) * (px / 100)), y: Math.round((ih - ch) * (py / 100)), w: cw, h: ch };
  }, [img, ratio, px, py]);

  useEffect(() => { if (crop) { setW(crop.w); setH(crop.h); } }, [crop?.w, crop?.h]); // eslint-disable-line

  const make = async () => {
    if (!img || !crop) throw new Error("Choose an image first.");
    if (!(w > 0 && h > 0) || w > 16384 || h > 16384) throw new Error("Width and height must be between 1 and 16384.");
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    if (fmt === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
    return canvasToBlob(c, fmt, 0.92);
  };
  const aspect = crop ? crop.w / crop.h : 1;
  const prevScale = img && crop ? Math.min(1, 520 / img.naturalWidth) : 1;

  return (
    <div className="stack">
      <Panel title="Image"><FileDrop multiple={false} accept="image/*" onFiles={(f) => setFile(f[0])} hint={file?.name} /><ErrorNote error={err} /></Panel>
      {img && crop && (
        <>
          <Panel title="Crop">
            <div className="params">
              <Field label="Aspect ratio"><select value={ratio} onChange={(e) => setRatio(e.target.value)}>{Object.keys(RATIOS).map((r) => <option key={r} value={r}>{r === "free" ? "Original" : r}</option>)}</select></Field>
              {ratio !== "free" && <Field label={`Horizontal position: ${px}%`}><input type="range" value={px} onChange={(e) => setPx(+e.target.value)} /></Field>}
              {ratio !== "free" && <Field label={`Vertical position: ${py}%`}><input type="range" value={py} onChange={(e) => setPy(+e.target.value)} /></Field>}
            </div>
            <div className="crop-stage" style={{ width: img.naturalWidth * prevScale, maxWidth: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="Source" style={{ width: "100%", display: "block" }} />
              <div className="crop-box" style={{ left: `${(crop.x / img.naturalWidth) * 100}%`, top: `${(crop.y / img.naturalHeight) * 100}%`, width: `${(crop.w / img.naturalWidth) * 100}%`, height: `${(crop.h / img.naturalHeight) * 100}%` }} />
            </div>
          </Panel>
          <Panel title="Output size">
            <div className="params">
              <Field label="Width (px)"><input type="number" className="mono" value={w} min={1} onChange={(e) => { const v = +e.target.value; setW(v); if (lock) setH(Math.max(1, Math.round(v / aspect))); }} /></Field>
              <Field label="Height (px)"><input type="number" className="mono" value={h} min={1} onChange={(e) => { const v = +e.target.value; setH(v); if (lock) setW(Math.max(1, Math.round(v * aspect))); }} /></Field>
              <Field label="Format"><select value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></Field>
            </div>
            <label className="check"><input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Keep proportions</label>
            <div className="row"><AsyncDownloadBtn primary label={`Download ${w} x ${h}`} name={`${baseName(file?.name ?? "image")}-${w}x${h}.${EXT[fmt]}`} make={make} /></div>
          </Panel>
        </>
      )}
    </div>
  );
}
