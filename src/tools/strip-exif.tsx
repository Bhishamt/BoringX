import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, FileDrop, Panel, Stat } from "@/components/kit";
import { stripImage, type StripResult } from "@/lib/exif";
import { sampleImage } from "@/lib/samples";
import { baseName, fmtBytes } from "@/lib/util";
import { zipBlobs } from "@/lib/zip";
import { download } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "strip-exif", name: "Strip EXIF", category: "Image",
  blurb: "Removes location, camera and edit data from photos. Pixels untouched.",
  description: "Remove EXIF, GPS, XMP and other hidden metadata from JPEG, PNG and WebP photos without re-encoding. Runs entirely in your browser.",
  keywords: ["exif", "metadata", "gps", "privacy", "strip", "remove", "photo"],
};

type Row = { name: string; before: number; result?: StripResult; blob?: Blob; error?: string };

export default function Tool() {
  const [rows, setRows] = useState<Row[]>([]);
  const [keepOrientation, setKeepOrientation] = useState(true);
  const [keepIcc, setKeepIcc] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  useEffect(() => { sampleImage("Sample photo", 640, 400, "image/jpeg", 30).then((f) => setFiles([f])); }, []);

  useEffect(() => {
    (async () => {
      const out: Row[] = [];
      for (const f of files) {
        try {
          const r = stripImage(new Uint8Array(await f.arrayBuffer()), { keepOrientation, keepIcc });
          out.push({ name: f.name, before: f.size, result: r, blob: new Blob([r.out as unknown as BlobPart], { type: f.type }) });
        } catch (e) { out.push({ name: f.name, before: f.size, error: e instanceof Error ? e.message : "Failed." }); }
      }
      setRows(out);
    })();
  }, [files, keepOrientation, keepIcc]);

  const ok = rows.filter((r) => r.blob);
  return (
    <div className="stack">
      <Panel title="Photos"><FileDrop accept="image/jpeg,image/png,image/webp" hint="JPEG, PNG and WebP. The sample photo has no metadata; drop a real photo to see what is removed." onFiles={setFiles} /></Panel>
      <Panel title="Options">
        <label className="check"><input type="checkbox" checked={keepOrientation} onChange={(e) => setKeepOrientation(e.target.checked)} /> Keep rotation (otherwise some photos display sideways)</label>
        <label className="check"><input type="checkbox" checked={keepIcc} onChange={(e) => setKeepIcc(e.target.checked)} /> Keep colour profile (not identifying; keeps colours accurate)</label>
      </Panel>
      {rows.length > 0 && (
        <Panel title="Results" actions={ok.length > 1 ? <Btn primary onClick={async () => download(await zipBlobs(ok.map((r) => ({ name: `${baseName(r.name)}-clean${r.name.match(/\.[^.]+$/)?.[0] ?? ""}`, data: r.blob! })), 0), "clean-photos.zip")}>Download all (.zip)</Btn> : null}>
          {rows.map((r, i) => (
            <div key={i} className="stack-sm">
              <div className="ledger-row file-row"><span className="mono file-name">{r.name}</span>
                {r.blob && <DownloadBtn primary data={r.blob} name={`${baseName(r.name)}-clean${r.name.match(/\.[^.]+$/)?.[0] ?? ""}`} label="Download clean copy" />}</div>
              <ErrorNote error={r.error} />
              {r.result && (
                <>
                  <Stat k="Location data (GPS)" v={r.result.hadGps ? "Found and removed" : "None found"} />
                  <Stat k="Removed" v={r.result.removed.length ? r.result.removed.map((x) => `${x.name} (${fmtBytes(x.bytes)})`).join(", ") : "Nothing. This file was already clean."} />
                  <Stat k="Size" v={`${fmtBytes(r.before)} to ${fmtBytes(r.blob!.size)}`} />
                </>
              )}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
