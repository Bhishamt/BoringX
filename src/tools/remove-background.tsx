import { useEffect, useState } from "react";
import type { ToolMeta } from "@/engine/types";
import { Btn, DownloadBtn, ErrorNote, FileDrop, Panel, Progress, useJob, useObjectUrl } from "@/components/kit";
import { sampleImage } from "@/lib/samples";
import { baseName, fmtBytes } from "@/lib/util";

export const meta: ToolMeta = {
  slug: "remove-background", name: "Remove Background", category: "Image",
  blurb: "Cuts the subject out of a photo. The model runs on your device.",
  description: "Remove image backgrounds in your browser with an on-device AI model. No upload, no account, no watermark. First use downloads the model from this site once.",
  keywords: ["background", "remove", "cutout", "transparent", "png", "ai", "imgly"],
};

export default function Tool() {
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState<Blob | null>(null);
  const [stage, setStage] = useState("");
  const job = useJob();
  const srcUrl = useObjectUrl(file); const outUrl = useObjectUrl(out);
  useEffect(() => { sampleImage("Sample", 640, 420, "image/jpeg", 20).then(setFile); }, []);

  const run = () => job.run(async (progress) => {
    if (!file) throw new Error("Choose an image first.");
    setOut(null); setStage("Loading the model (about 45 MB, cached after the first time)");
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(file, {
      publicPath: `${location.origin}/imgly/`, model: "isnet_quint8", device: "cpu", output: { format: "image/png" },
      progress: (key: string, cur: number, total: number) => { setStage(key.startsWith("fetch") ? "Loading the model" : "Removing background"); if (total) progress(cur / total); },
    }).catch((e: unknown) => { throw new Error(`Background removal failed: ${e instanceof Error ? e.message : "unknown error"}. Try a smaller image, or a browser with WebAssembly SIMD (any recent Chrome, Edge, Firefox, Safari).`); });
    setOut(blob);
  });

  return (
    <div className="stack">
      <Panel title="Image"><FileDrop multiple={false} accept="image/*" onFiles={(f) => { setFile(f[0]); setOut(null); }} hint={file ? `${file.name}, ${fmtBytes(file.size)}` : undefined} /></Panel>
      <Panel title="Remove">
        <ErrorNote error={job.error} />
        {job.busy && <p className="help" aria-live="polite">{stage}</p>}
        <Progress value={job.progress} label={stage.startsWith("Loading") ? "Model" : "Working"} />
        <div className="row">
          <Btn primary disabled={job.busy || !file} onClick={run}>Remove background</Btn>
          {out && file && <DownloadBtn primary data={out} name={`${baseName(file.name)}-cutout.png`} label={`Download PNG (${fmtBytes(out.size)})`} />}
        </div>
        <div className="compare">
          {srcUrl && <figure><figcaption>Before</figcaption>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={srcUrl} alt="Original" /></figure>}
          {outUrl && <figure><figcaption>After</figcaption>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="checker" src={outUrl} alt="Background removed" /></figure>}
        </div>
      </Panel>
    </div>
  );
}
