"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Btn, DownloadBtn, ErrorNote, FileDrop, Panel, Progress, useJob } from "./kit";
import { sampleImage } from "@/lib/samples";
import { zipBlobs } from "@/lib/zip";
import { download, fmtBytes } from "@/lib/util";

type Result = { src: File; blob: Blob; name: string; error?: string };

/** Shared shell for batch image tools: sample loaded, drop/paste/pick, process all, per-file results. */
export function ImageBatch({ title, options, process, deps, zipName, action = "Process" }: {
  title: string; options: ReactNode; process: (f: File) => Promise<{ blob: Blob; name: string }>; deps: unknown[]; zipName: string; action?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [sample, setSample] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const job = useJob();
  useEffect(() => { sampleImage("Sample photo", 800, 520, "image/jpeg", 200).then((f) => setFiles([f])); }, []);

  const run = () => job.run(async (progress) => {
    const out: Result[] = [];
    for (let i = 0; i < files.length; i++) {
      try { out.push({ src: files[i], ...(await process(files[i])) }); }
      catch (e) { out.push({ src: files[i], blob: new Blob(), name: "", error: e instanceof Error ? e.message : "Failed." }); }
      progress((i + 1) / files.length);
    }
    setResults(out);
  });
  // live re-run when files or options change; small batches finish well under a second
  useEffect(() => { if (files.length) run(); /* eslint-disable-next-line */ }, [files, ...deps]);

  const ok = results.filter((r) => !r.error);
  return (
    <div className="stack">
      <Panel title="Images">
        <FileDrop accept="image/*" hint={sample ? "A sample photo is loaded. Drop yours to replace it." : `${files.length} file${files.length === 1 ? "" : "s"} selected`}
          onFiles={(f) => { setFiles(sample ? f : [...files, ...f]); setSample(false); }} />
      </Panel>
      <Panel title={title}>
        {options}
        <ErrorNote error={job.error} />
        <Progress value={job.progress} label="Working" />
      </Panel>
      {results.length > 0 && (
        <Panel title="Results" actions={ok.length > 1 ? <Btn primary onClick={async () => download(await zipBlobs(ok.map((r) => ({ name: r.name, data: r.blob })), 0), zipName)}>Download all (.zip)</Btn> : null}>
          <ul className="ledger">
            {results.map((r, i) => (
              <li key={i} className="ledger-row file-row">
                <span className="mono file-name">{r.error ? r.src.name : r.name}</span>
                {r.error ? <span className="note-error">{r.error}</span> : (
                  <>
                    <span className="file-size">{fmtBytes(r.src.size)} to {fmtBytes(r.blob.size)} ({r.blob.size <= r.src.size ? "-" : "+"}{Math.abs(Math.round((1 - r.blob.size / r.src.size) * 100))}%)</span>
                    <DownloadBtn data={r.blob} name={r.name} label={action === "Process" ? "Save" : "Save"} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
