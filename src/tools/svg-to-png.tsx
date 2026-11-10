import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { AsyncDownloadBtn, ErrorNote, Field, FileDrop, Panel } from "@/components/kit";
import { SAMPLE_SVG } from "@/lib/samples";
import { canvasToBlob, loadImage } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "svg-to-png", name: "SVG to PNG", category: "Files",
  blurb: "Rasterises an SVG at the size you want.",
  description: "Convert SVG to PNG at any size or scale in your browser, with transparent or solid background. No upload.",
  keywords: ["svg", "png", "convert", "rasterize", "export", "vector"],
};

const url = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

export default function Tool() {
  const [svg, setSvg] = useState(SAMPLE_SVG);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(2);
  const [bg, setBg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setErr(null);
    if (!svg.trim()) { setDim(null); return; }
    loadImage(url(svg)).then((i) => { if (!i.naturalWidth) throw new Error("This SVG has no width and height. Add width and height attributes, or a viewBox."); setDim({ w: i.naturalWidth, h: i.naturalHeight }); })
      .catch(() => { setDim(null); setErr("This is not a valid SVG. Check that it starts with <svg and that every tag is closed."); });
  }, [svg]);

  const make = async () => {
    if (!dim) throw new Error("Fix the SVG first.");
    const img = await loadImage(url(svg));
    const c = document.createElement("canvas"); c.width = Math.round(dim.w * scale); c.height = Math.round(dim.h * scale);
    if (c.width > 16384 || c.height > 16384) throw new Error("That scale makes an image over 16384 pixels. Use a smaller scale.");
    const ctx = c.getContext("2d")!;
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return canvasToBlob(c, "image/png");
  };
  return (
    <div className="stack">
      <Panel title="SVG">
        <FileDrop multiple={false} accept=".svg,image/svg+xml" onFiles={async (f) => setSvg(await f[0].text())} hint="Or paste SVG code below." />
        <textarea className="mono text-in" rows={8} spellCheck={false} aria-label="SVG source" value={svg} onChange={(e) => setSvg(e.target.value)} />
        <ErrorNote error={err} />
      </Panel>
      <Panel title="PNG">
        <div className="params">
          <Field label={`Scale: ${scale}x${dim ? ` (${Math.round(dim.w * scale)} x ${Math.round(dim.h * scale)} px)` : ""}`}><input type="range" min={0.5} max={8} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} /></Field>
          <Field label="Background"><select value={bg} onChange={(e) => setBg(e.target.value)}><option value="">Transparent</option><option value="#ffffff">White</option><option value="#000000">Black</option></select></Field>
        </div>
        {dim && /* eslint-disable-next-line @next/next/no-img-element */ <img className={`preview-img ${bg ? "" : "checker"}`} style={bg ? { background: bg } : undefined} src={url(svg)} alt="SVG preview" />}
        <div className="row"><AsyncDownloadBtn primary label="Download PNG" name="image.png" make={make} /></div>
      </Panel>
    </div>
  );
}
