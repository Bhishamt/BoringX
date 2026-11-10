import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { DownloadBtn, ErrorNote, FileDrop, FileList, Btn, Panel, Progress, useJob } from "@/components/kit";
import { samplePdf } from "@/lib/samples";
import { fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "pdf-merge", name: "PDF Merge", category: "PDF",
  blurb: "Joins PDFs into one, in the order you choose.",
  description: "Merge PDF files into a single document in your browser. No upload, no page limit, no watermark.",
  keywords: ["pdf", "merge", "combine", "join", "pdf-lib"],
};

export default function Tool() {
  const [files, setFiles] = useState<File[]>([]);
  const [sample, setSample] = useState(true);
  const [out, setOut] = useState<Blob | null>(null);
  const job = useJob();
  useEffect(() => { (async () => setFiles([await samplePdf("Sample A", 2), await samplePdf("Sample B", 3)]))(); }, []);

  const merge = () => job.run(async (progress) => {
    if (files.length < 2) throw new Error("Add at least two PDFs to merge.");
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      let src;
      try { src = await PDFDocument.load(await files[i].arrayBuffer()); }
      catch { throw new Error(`"${files[i].name}" could not be read. It may be encrypted or damaged; remove it and try again.`); }
      (await doc.copyPages(src, src.getPageIndices())).forEach((p) => doc.addPage(p));
      progress((i + 1) / files.length);
    }
    setOut(new Blob([new Uint8Array(await doc.save()) as unknown as BlobPart], { type: "application/pdf" }));
  });

  const move = (i: number, d: -1 | 1) => { const f = [...files]; [f[i], f[i + d]] = [f[i + d], f[i]]; setFiles(f); setOut(null); };
  return (
    <div className="stack">
      <Panel title="Files">
        <FileDrop accept="application/pdf,.pdf" hint={sample ? "Two sample PDFs are loaded. Add yours to replace them." : undefined}
          onFiles={(f) => { setFiles(sample ? f : [...files, ...f]); setSample(false); setOut(null); }} />
        <FileList files={files} onRemove={(i) => { setFiles(files.filter((_, j) => j !== i)); setOut(null); }} onMove={move} />
      </Panel>
      <Panel title="Result">
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Merging" />
        <div className="row">
          <Btn primary disabled={job.busy} onClick={merge}>Merge {files.length} files</Btn>
          {out && <DownloadBtn data={out} name="merged.pdf" label={`Download merged.pdf (${fmtBytes(out.size)})`} primary />}
        </div>
      </Panel>
    </div>
  );
}
