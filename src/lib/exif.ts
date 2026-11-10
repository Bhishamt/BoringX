/** Lossless metadata stripping for JPEG, PNG and WebP. No re-encoding, so pixels are untouched. */
export type Removed = { name: string; bytes: number };
export type StripResult = { out: Uint8Array; removed: Removed[]; hadGps: boolean; orientation: number | null };

const u16 = (b: Uint8Array, o: number, le: boolean) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
const u32 = (b: Uint8Array, o: number, le: boolean) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode(...b.slice(o, o + n));

/** Reads Orientation and GPS presence from an EXIF TIFF block (starting at "II"/"MM"). */
export function readExif(t: Uint8Array): { orientation: number | null; hasGps: boolean } {
  const le = t[0] === 0x49;
  if (t.length < 8) return { orientation: null, hasGps: false };
  let ifd = u32(t, 4, le), orientation: number | null = null, hasGps = false;
  if (ifd + 2 > t.length) return { orientation, hasGps };
  const n = u16(t, ifd, le);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > t.length) break;
    const tag = u16(t, e, le);
    if (tag === 0x0112) orientation = u16(t, e + 8, le);
    if (tag === 0x8825) hasGps = true;
  }
  return { orientation, hasGps };
}

function minimalExif(orientation: number): Uint8Array {
  // "Exif\0\0" + II*\0 + IFD offset 8 + 1 entry (Orientation) + next IFD 0
  const b = [0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation & 0xff, 0, 0, 0, 0, 0, 0, 0];
  return Uint8Array.from(b);
}

export function stripJpeg(src: Uint8Array, opts: { keepOrientation: boolean; keepIcc: boolean }): StripResult {
  if (src[0] !== 0xff || src[1] !== 0xd8) throw new Error("This is not a valid JPEG file (it does not start with the JPEG marker).");
  const parts: Uint8Array[] = [src.subarray(0, 2)];
  const removed: Removed[] = [];
  let hadGps = false, orientation: number | null = null, i = 2;
  while (i < src.length) {
    if (src[i] !== 0xff) throw new Error("This JPEG is damaged: unexpected data between segments.");
    while (src[i + 1] === 0xff) i++;
    const marker = src[i + 1];
    if (marker === 0xda) { parts.push(src.subarray(i)); i = src.length; break; } // start of scan: copy the rest
    if (marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { parts.push(src.subarray(i, i + 2)); i += 2; continue; }
    const len = (src[i + 2] << 8) | src[i + 3];
    const seg = src.subarray(i, i + 2 + len);
    const body = seg.subarray(4);
    let drop = false, name = "";
    if (marker === 0xe1 && ascii(body, 0, 4) === "Exif") {
      const r = readExif(body.subarray(6)); hadGps ||= r.hasGps; orientation = r.orientation; drop = true; name = "EXIF";
    } else if (marker === 0xe1 && ascii(body, 0, 28).startsWith("http://ns.adobe.com/xap")) { drop = true; name = "XMP"; }
    else if (marker === 0xe2 && ascii(body, 0, 11) === "ICC_PROFILE") { drop = !opts.keepIcc; name = "ICC profile"; }
    else if (marker === 0xed) { drop = true; name = "IPTC/Photoshop"; }
    else if (marker === 0xfe) { drop = true; name = "Comment"; }
    else if (marker >= 0xe0 && marker <= 0xef && marker !== 0xe0 && marker !== 0xe2) { drop = true; name = `APP${marker - 0xe0}`; }
    if (drop) removed.push({ name, bytes: seg.length }); else parts.push(seg);
    i += 2 + len;
  }
  if (opts.keepOrientation && orientation && orientation !== 1) {
    const ex = minimalExif(orientation), len = ex.length + 2;
    parts.splice(1, 0, Uint8Array.from([0xff, 0xe1, len >> 8, len & 0xff, ...ex]));
  }
  return { out: concat(parts), removed, hadGps, orientation };
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export const crc32 = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export function stripPng(src: Uint8Array, opts: { keepIcc: boolean }): StripResult {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((v, i) => src[i] === v)) throw new Error("This is not a valid PNG file (wrong signature).");
  const keep = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "acTL", "fcTL", "fdAT", "cHRM", "gAMA", "sBIT", "sRGB", "bKGD", "pHYs"]);
  if (opts.keepIcc) keep.add("iCCP");
  const parts: Uint8Array[] = [src.subarray(0, 8)];
  const removed: Removed[] = [];
  let hadGps = false, i = 8;
  while (i + 12 <= src.length) {
    const len = u32(src, i, false), type = ascii(src, i + 4, 4), total = len + 12;
    const chunk = src.subarray(i, i + total);
    if (keep.has(type)) parts.push(chunk);
    else {
      removed.push({ name: type === "eXIf" ? "EXIF" : type === "iTXt" || type === "tEXt" || type === "zTXt" ? `Text (${type})` : type === "tIME" ? "Modified time" : type, bytes: total });
      if (type === "eXIf") hadGps ||= readExif(src.subarray(i + 8, i + 8 + len)).hasGps;
    }
    i += total;
  }
  return { out: concat(parts), removed, hadGps, orientation: null };
}

export function stripWebp(src: Uint8Array): StripResult {
  if (ascii(src, 0, 4) !== "RIFF" || ascii(src, 8, 4) !== "WEBP") throw new Error("This is not a valid WebP file.");
  const parts: Uint8Array[] = [];
  const removed: Removed[] = [];
  let hadGps = false, i = 12;
  while (i + 8 <= src.length) {
    const type = ascii(src, i, 4), len = u32(src, i + 4, true), total = 8 + len + (len & 1);
    let chunk = src.subarray(i, i + total);
    if (type === "EXIF" || type === "XMP ") {
      removed.push({ name: type.trim(), bytes: total });
      if (type === "EXIF") hadGps ||= readExif(src.subarray(i + 8 + (ascii(src, i + 8, 4) === "Exif" ? 6 : 0), i + 8 + len)).hasGps;
      i += total; continue;
    }
    if (type === "VP8X") { chunk = Uint8Array.from(chunk); chunk[8] &= ~(0x08 | 0x04); } // clear EXIF and XMP flags
    parts.push(chunk);
    i += total;
  }
  const body = concat(parts);
  const out = new Uint8Array(12 + body.length);
  out.set(src.subarray(0, 12)); out.set(body, 12);
  new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return { out, removed, hadGps, orientation: null };
}

export function stripImage(bytes: Uint8Array, opts: { keepOrientation: boolean; keepIcc: boolean }): StripResult {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return stripJpeg(bytes, opts);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return stripPng(bytes, opts);
  if (ascii(bytes, 0, 4) === "RIFF") return stripWebp(bytes);
  throw new Error("Only JPEG, PNG and WebP are supported. HEIC, GIF and TIFF cannot be cleaned losslessly in the browser; convert to JPEG first with Image Convert.");
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
