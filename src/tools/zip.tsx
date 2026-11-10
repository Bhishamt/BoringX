import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, Field, FileDrop, FileList, Panel, useJob } from "@/components/kit";
import { zipBlobs } from "@/lib/zip";
import { download, fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "zip", name: "Zip and Unzip", category: "Files",
  blurb: "Makes a .zip from files, or opens one and lets you save parts.",
  description: "Create ZIP archives or open and extract them in your browser. No upload, no size limit beyond your memory.",
  keywords: ["zip", "unzip", "archive", "extract", "compress", "files"],
};

type Entry = { name: string; size: number; dir: boolean; get: () => Promise<Blob> };

export default function Tool() {
  const [mode, setMode] = useState<"zip" | "unzip">("zip");
  const [files, setFiles] = useState<File[]>([]);
  const [sample, setSample] = useState(true);
  const [level, setLevel] = useState(6);
  const [out, setOut] = useState<Blob | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [zipName, setZipName] = useState("");
  const job = useJob();
  useEffect(() => { setFiles([new File(["Nothing exciting happens here.\n"], "hello.txt", { type: "text/plain" }), new File(["id,name\n1,Ada\n2,Grace\n"], "people.csv", { type: "text/csv" })]); }, []);

  const make = () => job.run(async () => {
    if (!files.length) throw new Error("Add at least one file.");
    setOut(await zipBlobs(files.map((f) => ({ name: f.name, data: f })), level));
  });
  const open = (f: File) => job.run(async () => {
    const JSZip = (await import("jszip")).default;
    let z; try { z = await JSZip.loadAsync(f); } catch { throw new Error(`"${f.name}" could not be opened. It may not be a ZIP, may be damaged, or may be password protected (not supported).`); }
    setZipName(f.name);
    setEntries(Object.values(z.files).map((e) => ({ name: e.name, dir: e.dir, size: (e as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0, get: () => e.async("blob") })));
  });
  const sampleZip = async () => { setSample(false); const b = await zipBlobs([{ name: "hello.txt", data: "Nothing exciting happens here.\n" }, { name: "docs/readme.md", data: "# Sample\n" }]); await open(new File([b], "sample.zip")); };
  useEffect(() => { if (mode === "unzip" && !entries.length) sampleZip(); }, [mode]); // eslint-disable-line

  return (
    <div className="stack">
      <div role="tablist" className="seg" aria-label="Mode">
        <button role="tab" aria-selected={mode === "zip"} className={`seg-btn ${mode === "zip" ? "on" : ""}`} onClick={() => setMode("zip")}>Zip</button>
        <button role="tab" aria-selected={mode === "unzip"} className={`seg-btn ${mode === "unzip" ? "on" : ""}`} onClick={() => setMode("unzip")}>Unzip</button>
      </div>
      {mode === "zip" ? (
        <>
          <Panel title="Files">
            <FileDrop hint={sample ? "Two sample files are loaded. Add yours to replace them." : undefined} onFiles={(f) => { setFiles(sample ? f : [...files, ...f]); setSample(false); setOut(null); }} />
            <FileList files={files} onRemove={(i) => { setFiles(files.filter((_, j) => j !== i)); setOut(null); }} />
          </Panel>
          <Panel title="Archive">
            <Field label={`Compression level: ${level === 0 ? "none (store)" : level}`}><input type="range" min={0} max={9} value={level} onChange={(e) => { setLevel(+e.target.value); setOut(null); }} /></Field>
            <ErrorNote error={job.error} />
            <div className="row"><Btn primary disabled={job.busy} onClick={make}>Make .zip</Btn>{out && <DownloadBtn primary data={out} name="archive.zip" label={`Download archive.zip (${fmtBytes(out.size)})`} />}</div>
          </Panel>
        </>
      ) : (
        <>
          <Panel title="Archive"><FileDrop multiple={false} accept=".zip,application/zip" onFiles={(f) => open(f[0])} hint={zipName || undefined} /><ErrorNote error={job.error} /></Panel>
          {entries.length > 0 && (
            <Panel title={`${entries.filter((e) => !e.dir).length} files`} actions={<Btn onClick={async () => { for (const e of entries.filter((x) => !x.dir)) download(await e.get(), e.name.split("/").pop()!); }}>Save all</Btn>}>
              <ul className="ledger">{entries.filter((e) => !e.dir).map((e) => (
                <li key={e.name} className="ledger-row file-row"><span className="mono file-name">{e.name}</span><span className="file-size">{e.size ? fmtBytes(e.size) : ""}</span><Btn onClick={async () => download(await e.get(), e.name.split("/").pop()!)}>Save</Btn></li>
              ))}</ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
