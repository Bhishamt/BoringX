import { useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Field } from "@/components/kit";
import { ImageBatch } from "@/components/ImageBatch";
import { EXT, baseName, canvasToBlob, imageToCanvas } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "image-convert", name: "Image Convert", category: "Image",
  blurb: "PNG, JPG, WebP and AVIF, in any direction.",
  description: "Convert images between PNG, JPG, WebP and AVIF in your browser. Batch many files. No upload.",
  keywords: ["image", "convert", "png", "jpg", "webp", "avif", "format"],
};

export default function Tool() {
  const [fmt, setFmt] = useState("image/png");
  const [q, setQ] = useState(90);
  return (
    <ImageBatch title="Convert to" zipName="converted-images.zip" deps={[fmt, q]}
      options={
        <div className="params">
          <Field label="Format"><select value={fmt} onChange={(e) => setFmt(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option><option value="image/avif">AVIF</option></select></Field>
          {fmt !== "image/png" && <Field label={`Quality: ${q}`}><input type="range" min={10} max={100} value={q} onChange={(e) => setQ(+e.target.value)} /></Field>}
        </div>
      }
      process={async (f) => {
        const c = await imageToCanvas(f, undefined, fmt === "image/jpeg" ? "#ffffff" : undefined);
        let blob: Blob;
        try { blob = await canvasToBlob(c, fmt, q / 100); }
        catch { throw new Error(fmt === "image/avif" ? "This browser cannot encode AVIF. Chrome and Edge can; Safari and Firefox cannot yet. Choose WebP instead." : `This browser cannot encode ${fmt}.`); }
        return { blob, name: `${baseName(f.name)}.${EXT[fmt]}` };
      }} />
  );
}
