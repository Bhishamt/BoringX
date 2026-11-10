import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, Field, FileDrop, Panel, Progress, Stat, useJob } from "@/components/kit";
import { openPdf, renderPageToBlob } from "@/lib/pdf";
import { samplePdf } from "@/lib/samples";
import { baseName, fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "pdf-compress", name: "PDF Compress", category: "PDF",
  blurb: "Shrinks a PDF. Light tidy-up, or flatten pages to images.",
  description: "Reduce PDF file size in your browser. Choose a lossless tidy-up or flatten pages to compressed images for scans. No upload.",
  keywords: ["pdf", "compress", "reduce size", "shrink", "optimize"],
};

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"tidy" | "flatten">("tidy");
  const [quality, setQuality] = useState(60);
  const [dpi, setDpi] = useState(110);
  const [out, setOut] = useState<Blob | null>(null);
  const job = useJob();
  useEffect(() => { samplePdf("Sample", 4).then(setFile); }, []);

  const run = () => job.run(async (progress) => {
    if (!file) throw new Error("Choose a PDF first.");
    const { PDFDocument } = await import("pdf-lib");
    if (mode === "tidy") {
      let src; try { src = await PDFDocument.load(await file.arrayBuffer()); } catch { throw new Error("This PDF could not be read. It may be encrypted or damaged."); }
      src.setTitle(""); src.setAuthor(""); src.setSubject(""); src.setKeywords([]); src.setProducer(""); src.setCreator("");
      setOut(new Blob([new Uint8Array(await src.save({ useObjectStreams: true })) as unknown as BlobPart], { type: "application/pdf" }));
      return;
    }
    const doc = await openPdf(file);
    const dst = await PDFDocument.create();
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const { blob } = await renderPageToBlob(doc, i, dpi / 72, "image/jpeg", quality / 100);
      const img = await dst.embedJpg(new Uint8Array(await blob.arrayBuffer()));
      dst.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
      progress(i / doc.numPages);
    }
    setOut(new Blob([new Uint8Array(await dst.save()) as unknown as BlobPart], { type: "application/pdf" }));
  });

  return (
    <div className="stack">
      <Panel title="File"><FileDrop multiple={false} accept="application/pdf,.pdf" onFiles={(f) => { setFile(f[0]); setOut(null); }} hint={file ? `${file.name}, ${fmtBytes(file.size)}` : undefined} /></Panel>
      <Panel title="Method">
        <div className="seg" role="tablist" aria-label="Method">
          <button role="tab" aria-selected={mode === "tidy"} className={`seg-btn ${mode === "tidy" ? "on" : ""}`} onClick={() => { setMode("tidy"); setOut(null); }}>Tidy up</button>
          <button role="tab" aria-selected={mode === "flatten"} className={`seg-btn ${mode === "flatten" ? "on" : ""}`} onClick={() => { setMode("flatten"); setOut(null); }}>Flatten to images</button>
        </div>
        {mode === "tidy" ? (
          <p className="help">Lossless. Repacks the file and clears document metadata. Text stays selectable. Gains are modest on already-optimised files.</p>
        ) : (
          <>
            <p className="help">Lossy. Every page becomes a JPEG, which helps scans a lot. Text will no longer be selectable or searchable.</p>
            <div className="params">
              <Field label={`JPEG quality: ${quality}`}><input type="range" min={20} max={95} value={quality} onChange={(e) => setQuality(+e.target.value)} /></Field>
              <Field label={`Resolution: ${dpi} dpi`}><input type="range" min={60} max={220} step={10} value={dpi} onChange={(e) => setDpi(+e.target.value)} /></Field>
            </div>
          </>
        )}
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Compressing" />
        <div className="row"><Btn primary disabled={job.busy || !file} onClick={run}>Compress</Btn></div>
      </Panel>
      {out && file && (
        <Panel title="Result" actions={<DownloadBtn primary data={out} name={`${baseName(file.name)}-compressed.pdf`} label="Download" />}>
          <Stat k="Before" v={fmtBytes(file.size)} />
          <Stat k="After" v={fmtBytes(out.size)} />
          <Stat k="Change" v={out.size < file.size ? `${Math.round((1 - out.size / file.size) * 100)}% smaller` : "No smaller. Try the other method, or this file is already compact."} />
        </Panel>
      )}
    </div>
  );
}
