import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, Field, FileDrop, Panel, Progress, useJob } from "@/components/kit";
import { samplePdf } from "@/lib/samples";
import { parseRanges } from "@/lib/pdf";
import { zipBlobs } from "@/lib/zip";
import { baseName, fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "pdf-split", name: "PDF Split", category: "PDF",
  blurb: "Pulls pages out of a PDF by range, or one file per page.",
  description: "Split a PDF by page ranges or into one file per page, in your browser. No upload.",
  keywords: ["pdf", "split", "extract pages", "separate", "range"],
};

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState<"ranges" | "each">("ranges");
  const [spec, setSpec] = useState("1-2, 4");
  const [out, setOut] = useState<{ blob: Blob; name: string } | null>(null);
  const job = useJob();

  const load = (f: File) => job.run(async () => {
    const { PDFDocument } = await import("pdf-lib");
    try { const d = await PDFDocument.load(await f.arrayBuffer()); setPages(d.getPageCount()); setFile(f); setOut(null); }
    catch { throw new Error(`"${f.name}" could not be read as a PDF. It may be encrypted or damaged.`); }
  });
  useEffect(() => { samplePdf("Sample", 5).then(load); }, []); // eslint-disable-line

  const split = () => job.run(async (progress) => {
    if (!file) throw new Error("Choose a PDF first.");
    const { PDFDocument } = await import("pdf-lib");
    const src = await PDFDocument.load(await file.arrayBuffer());
    const groups = mode === "each" ? Array.from({ length: pages }, (_, i) => [i]) : parseRanges(spec, pages);
    const base = baseName(file.name);
    const files: { name: string; data: Uint8Array }[] = [];
    for (let g = 0; g < groups.length; g++) {
      const d = await PDFDocument.create();
      (await d.copyPages(src, groups[g])).forEach((p) => d.addPage(p));
      const label = groups[g].length === 1 ? `p${groups[g][0] + 1}` : `p${groups[g][0] + 1}-${groups[g][groups[g].length - 1] + 1}`;
      files.push({ name: `${base}-${label}.pdf`, data: await d.save() });
      progress((g + 1) / groups.length);
    }
    setOut(files.length === 1
      ? { blob: new Blob([files[0].data as unknown as BlobPart], { type: "application/pdf" }), name: files[0].name }
      : { blob: await zipBlobs(files, 0), name: `${base}-split.zip` });
  });

  return (
    <div className="stack">
      <Panel title="File">
        <FileDrop multiple={false} accept="application/pdf,.pdf" onFiles={(f) => load(f[0])} hint={file ? `${file.name}, ${pages} pages` : undefined} />
      </Panel>
      <Panel title="Split">
        <div className="seg" role="tablist" aria-label="Mode">
          <button role="tab" aria-selected={mode === "ranges"} className={`seg-btn ${mode === "ranges" ? "on" : ""}`} onClick={() => setMode("ranges")}>By range</button>
          <button role="tab" aria-selected={mode === "each"} className={`seg-btn ${mode === "each" ? "on" : ""}`} onClick={() => setMode("each")}>One file per page</button>
        </div>
        {mode === "ranges" && <Field label="Pages" help={`Each comma-separated range becomes its own file. This document has ${pages || "?"} pages.`}><input className="mono" value={spec} onChange={(e) => setSpec(e.target.value)} /></Field>}
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Splitting" />
        <div className="row">
          <Btn primary disabled={job.busy || !file} onClick={split}>Split</Btn>
          {out && <DownloadBtn primary data={out.blob} name={out.name} label={`Download ${out.name} (${fmtBytes(out.blob.size)})`} />}
        </div>
      </Panel>
    </div>
  );
}
