import { useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Field } from "@/components/kit";
import { ImageBatch } from "@/components/ImageBatch";
import { EXT, baseName, canvasToBlob, imageToCanvas } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "image-compress", name: "Image Compress", category: "Image",
  blurb: "Makes images smaller. Pick quality, watch the size.",
  description: "Compress JPG, PNG and WebP images in your browser. Adjust quality and maximum size, batch many files, download as ZIP. No upload.",
  keywords: ["image", "compress", "reduce size", "jpg", "png", "webp", "optimize", "shrink"],
};

export default function Tool() {
  const [q, setQ] = useState(70);
  const [fmt, setFmt] = useState("image/webp");
  const [max, setMax] = useState(2048);
  return (
    <ImageBatch title="Options" zipName="compressed-images.zip" deps={[q, fmt, max]}
      options={
        <div className="params">
          <Field label={`Quality: ${q}`}><input type="range" min={10} max={100} value={q} onChange={(e) => setQ(+e.target.value)} /></Field>
          <Field label="Output format"><select value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="image/webp">WebP (smallest)</option><option value="image/jpeg">JPG</option><option value="image/png">PNG (lossless, quality ignored)</option></select></Field>
          <Field label="Longest side, pixels (0 = keep)"><input type="number" className="mono" min={0} value={max} onChange={(e) => setMax(Math.max(0, +e.target.value))} /></Field>
        </div>
      }
      process={async (f) => {
        const c = await imageToCanvas(f, max || undefined, fmt === "image/jpeg" ? "#ffffff" : undefined);
        const blob = await canvasToBlob(c, fmt, q / 100);
        return { blob, name: `${baseName(f.name)}-small.${EXT[fmt]}` };
      }} />
  );
}
