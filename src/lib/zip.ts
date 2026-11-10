export async function zipBlobs(entries: { name: string; data: Blob | Uint8Array | string }[], level = 6): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const z = new JSZip();
  const used = new Set<string>();
  for (const e of entries) {
    let n = e.name, i = 2;
    while (used.has(n)) n = e.name.replace(/(\.[^.]*)?$/, `-${i++}$1`);
    used.add(n);
    z.file(n, e.data);
  }
  return z.generateAsync({ type: "blob", compression: level ? "DEFLATE" : "STORE", compressionOptions: { level: level || 1 } });
}
