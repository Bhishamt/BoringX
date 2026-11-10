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
        catch {
          if (fmt !== "image/avif") throw new Error(`This browser cannot encode ${fmt}. Choose PNG, JPG or WebP.`);
          // Browsers rarely encode AVIF natively, so fall back to a WebAssembly encoder served from this site.
          try {
            const url = "/codecs/avif_enc.js"; // copied from @jsquash/avif by scripts/copy-assets.mjs
            const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
            const enc = await mod.default({ locateFile: (f: string) => `/codecs/${f}` });
            const px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
            const out: Uint8Array | null = enc.encode(new Uint8Array(px.data.buffer), c.width, c.height, { quality: q, qualityAlpha: -1, denoiseLevel: 0, tileColsLog2: 0, tileRowsLog2: 0, speed: 8, subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false });
            if (!out) throw new Error("the encoder returned no data");
            blob = new Blob([out as unknown as BlobPart], { type: "image/avif" });
          } catch (e) { throw new Error(`AVIF encoding failed: ${e instanceof Error ? e.message : "unknown error"}. Choose WebP instead.`); }
        }
        return { blob, name: `${baseName(f.name)}.${EXT[fmt]}` };
      }} />
  );
}
