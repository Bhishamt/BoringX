import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, Field, FileDrop, FileList, Panel, Progress, useJob } from "@/components/kit";
import { sampleImage } from "@/lib/samples";
import { canvasToBlob, fmtBytes, loadImage } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "images-to-pdf", name: "Images to PDF", category: "PDF",
  blurb: "Puts images on pages, one per page, in your order.",
  description: "Combine JPG, PNG and WebP images into a single PDF in your browser. Choose page size and margins. No upload.",
  keywords: ["images", "pdf", "jpg to pdf", "png to pdf", "convert", "combine"],
};

const SIZES: Record<string, [number, number] | null> = { fit: null, a4: [595.28, 841.89], letter: [612, 792] };

export default function Tool() {
  const [files, setFiles] = useState<File[]>([]);
  const [sample, setSample] = useState(true);
  const [size, setSize] = useState("fit");
  const [margin, setMargin] = useState(24);
  const [out, setOut] = useState<Blob | null>(null);
  const job = useJob();
  useEffect(() => { Promise.all([sampleImage("Sample one", 640, 400, "image/png", 225), sampleImage("Sample two", 480, 640, "image/jpeg", 20)]).then(setFiles); }, []);

  const build = () => job.run(async (progress) => {
    if (!files.length) throw new Error("Add at least one image.");
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let bytes = new Uint8Array(await f.arrayBuffer());
      let kind: "jpg" | "png" = f.type === "image/jpeg" ? "jpg" : f.type === "image/png" ? "png" : "png";
      if (f.type !== "image/jpeg" && f.type !== "image/png") {
        const img = await loadImage(f);
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        bytes = new Uint8Array(await (await canvasToBlob(c, "image/png")).arrayBuffer()); kind = "png";
      }
      const img = kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const fixed = SIZES[size];
      const m = fixed ? margin : 0;
      const [pw, ph] = fixed ?? [img.width, img.height];
      const page = doc.addPage([pw, ph]);
      const s = Math.min((pw - 2 * m) / img.width, (ph - 2 * m) / img.height, fixed ? Infinity : 1);
      page.drawImage(img, { x: (pw - img.width * s) / 2, y: (ph - img.height * s) / 2, width: img.width * s, height: img.height * s });
      progress((i + 1) / files.length);
    }
    setOut(new Blob([new Uint8Array(await doc.save()) as unknown as BlobPart], { type: "application/pdf" }));
  });

  const move = (i: number, d: -1 | 1) => { const f = [...files]; [f[i], f[i + d]] = [f[i + d], f[i]]; setFiles(f); setOut(null); };
  return (
    <div className="stack">
      <Panel title="Images">
        <FileDrop accept="image/*" hint={sample ? "Two sample images are loaded. Add yours to replace them." : undefined} onFiles={(f) => { setFiles(sample ? f : [...files, ...f]); setSample(false); setOut(null); }} />
        <FileList files={files} onMove={move} onRemove={(i) => { setFiles(files.filter((_, j) => j !== i)); setOut(null); }} />
      </Panel>
      <Panel title="Page">
        <div className="params">
          <Field label="Page size"><select value={size} onChange={(e) => setSize(e.target.value)}><option value="fit">Same as image</option><option value="a4">A4</option><option value="letter">US Letter</option></select></Field>
          {size !== "fit" && <Field label={`Margin: ${margin} pt`}><input type="range" min={0} max={72} value={margin} onChange={(e) => setMargin(+e.target.value)} /></Field>}
        </div>
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Building" />
        <div className="row">
          <Btn primary disabled={job.busy} onClick={build}>Make PDF</Btn>
          {out && <DownloadBtn primary data={out} name="images.pdf" label={`Download images.pdf (${fmtBytes(out.size)})`} />}
        </div>
      </Panel>
    </div>
  );
}
