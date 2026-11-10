import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { CopyBtn, ErrorNote, Field, FileDrop, Panel, Progress, useJob } from "@/components/kit";
import { ALGOS, hashBytes, type Algo } from "@/lib/hash";
import { fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "file-checksum", name: "File Checksum", category: "Files",
  blurb: "SHA-256, SHA-1, SHA-512 and MD5 of any file. Compare to a known hash.",
  description: "Compute SHA-256, SHA-1, SHA-512 and MD5 checksums of files in your browser and compare them to a published hash. The file never leaves your device.",
  keywords: ["checksum", "hash", "sha256", "md5", "verify", "integrity", "file"],
};

type Row = { name: string; size: number; hashes: Record<string, string> };

export default function Tool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [algos, setAlgos] = useState<Algo[]>(["SHA-256", "MD5"]);
  const [files, setFiles] = useState<File[]>([]);
  const [expected, setExpected] = useState("");
  const [sample, setSample] = useState(true);
  const job = useJob();
  useEffect(() => { setFiles([new File(["Nothing exciting happens here.\n"], "sample.txt", { type: "text/plain" })]); }, []);

  useEffect(() => {
    if (!files.length) return;
    job.run(async (progress) => {
      const out: Row[] = [];
      for (let i = 0; i < files.length; i++) {
        const bytes = new Uint8Array(await files[i].arrayBuffer());
        const hashes: Record<string, string> = {};
        for (const a of algos) hashes[a] = await hashBytes(a, bytes);
        out.push({ name: files[i].name, size: files[i].size, hashes });
        progress((i + 1) / files.length);
      }
      setRows(out);
    });
  }, [files, algos]); // eslint-disable-line

  const exp = expected.trim().toLowerCase().replace(/\s+/g, "");
  const toggle = (a: Algo) => setAlgos((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  return (
    <div className="stack">
      <Panel title="Files"><FileDrop hint={sample ? "A sample file is loaded. Drop yours to replace it." : undefined} onFiles={(f) => { setFiles(f); setSample(false); }} /></Panel>
      <Panel title="Algorithms">
        <div className="row">{ALGOS.map((a) => <label key={a} className="check"><input type="checkbox" checked={algos.includes(a)} onChange={() => toggle(a)} /> {a}</label>)}</div>
        <Field label="Compare with a known hash (optional)"><input className="mono" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Paste the published checksum" spellCheck={false} /></Field>
        {algos.length === 0 && <ErrorNote error="Pick at least one algorithm." />}
        <ErrorNote error={job.error} /><Progress value={job.progress} label="Hashing" />
      </Panel>
      {rows.map((r, i) => (
        <Panel key={i} title={`${r.name} (${fmtBytes(r.size)})`}>
          {Object.entries(r.hashes).map(([a, h]) => (
            <div key={a} className="ledger-row hash-row">
              <span className="stat-k">{a}</span>
              <span className="mono hash">{h}</span>
              {exp && <span className={h === exp ? "ok" : "no"} role="status">{h === exp ? "Match" : "No match"}</span>}
              <CopyBtn text={h} />
            </div>
          ))}
        </Panel>
      ))}
    </div>
  );
}
