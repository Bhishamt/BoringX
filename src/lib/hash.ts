import { md5 } from "./md5";

export type Algo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const ALGOS: Algo[] = ["SHA-256", "SHA-1", "MD5", "SHA-384", "SHA-512"];

export async function hashBytes(algo: Algo, bytes: Uint8Array): Promise<string> {
  if (algo === "MD5") return md5(bytes);
  const d = await crypto.subtle.digest(algo, bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
