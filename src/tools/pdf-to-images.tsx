import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, Field, FileDrop, Panel, Progress, useJob } from "@/components/kit";
import { openPdf, renderPageToBlob } from "@/lib/pdf";
import { samplePdf } from "@/lib/samples";
import { zipBlobs } from "@/lib/zip";
import { baseName, download } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "pdf-to-images", name: "PDF to Images", category: "PDF",
  blurb: "Renders each PDF page as a PNG or JPG.",
  description: "Convert PDF pages to PNG or JPG images in your browser at the resolution you choose. No upload.",
  keywords: ["pdf", "png", "jpg", "images", "convert", "render pages", "pdfjs"],
};

type Page = { n: number; blob: Blob; url: string };

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [fmt, setFmt] = useState<"image/png" | "image/jpeg">("image/png");
  const [dpi, setDpi] = useState(120);
  const [pages, setPages] = useState<Page[]>([]);
  const job = useJob();
  useEffect(() => { samplePdf("Sample", 3).then(setFile); }, []);
  useEffect(() => () => pages.forEach((p) => URL.revokeObjectURL(p.url)), [pages]);

  const ext = fmt === "image/png" ? "png" : "jpg";
  const run = () => job.run(async (progress) => {
    if (!file) throw new Error("Choose a PDF first.");
    const doc = await openPdf(file);
    const out: Page[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const { blob } = await renderPageToBlob(doc, i, dpi / 72, fmt, 0.9);
      out.push({ n: i, blob, url: URL.createObjectURL(blob) });
      progress(i / doc.numPages);
    }
    setPages(out);
  });
  useEffect(() => { if (file) run(); /* eslint-disable-next-line */ }, [file]);

  return (
    <div className="stack">
      <Panel title="File"><FileDrop multiple={false} accept="application/pdf,.pdf" onFiles={(f) => setFile(f[0])} hint={file?.name} /></Panel>
      <Panel title="Options">
        <div className="params">
          <Field label="Format"><select value={fmt} onChange={(e) => setFmt(e.target.value as typeof fmt)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></Field>
          <Field label={`Resolution: ${dpi} dpi`}><input type="range" min={60} max={300} step={10} value={dpi} onChange={(e) => setDpi(+e.target.value)} /></Field>
        </div>
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Rendering" />
        <div className="row">
          <Btn primary disabled={job.busy || !file} onClick={run}>Render again</Btn>
          {pages.length > 0 && <Btn onClick={async () => download(await zipBlobs(pages.map((p) => ({ name: `${baseName(file!.name)}-${p.n}.${ext}`, data: p.blob })), 0), `${baseName(file!.name)}-images.zip`)}>Download all (.zip)</Btn>}
        </div>
      </Panel>
      {pages.length > 0 && (
        <Panel title={`${pages.length} page${pages.length === 1 ? "" : "s"}`}>
          <div className="thumbs">
            {pages.map((p) => (
              <figure key={p.n} className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Page ${p.n}`} />
                <figcaption className="row"><span className="mono">p{p.n}</span><DownloadBtn data={p.blob} name={`${baseName(file!.name)}-${p.n}.${ext}`} label="Save" /></figcaption>
              </figure>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
