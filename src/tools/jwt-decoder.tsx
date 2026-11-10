import type { BlockDef, ToolMeta } from "@/engine/types";
import { toolFromRecipe } from "@/components/toolFromRecipe";
import { b64decode } from "./base64";

export const meta: ToolMeta = {
  slug: "jwt-decoder", name: "JWT Decoder", category: "Dev",
  blurb: "Reads a JWT's header and claims. Does not verify the signature.",
  description: "Decode a JSON Web Token to see its header and claims, with human-readable expiry. Nothing is sent anywhere.",
  keywords: ["jwt", "json web token", "decode", "claims", "bearer", "auth"],
  recipe: {
    name: "JWT Decoder",
    input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.sig",
    steps: [{ b: "jwt-decode", p: {} }],
  },
};

const when = (n: unknown) => (typeof n === "number" ? `${new Date(n * 1000).toISOString()} (${n < Date.now() / 1000 ? "past" : "future"})` : String(n));

export const blocks: BlockDef[] = [{
  id: "jwt-decode", name: "Decode JWT", category: "Dev", description: "Decodes header and payload. Does not verify.", params: [],
  run: (input) => {
    const t = input.trim().replace(/^Bearer\s+/i, "");
    const parts = t.split(".");
    if (parts.length < 2 || parts.length > 3) throw new Error("A JWT has three parts separated by dots (header.payload.signature). This has " + parts.length + ".");
    let header: Record<string, unknown>, payload: Record<string, unknown>;
    try { header = JSON.parse(b64decode(parts[0])); payload = JSON.parse(b64decode(parts[1])); }
    catch { throw new Error("The header or payload is not valid Base64-encoded JSON. Check that the whole token was copied."); }
    const times = ["iat", "nbf", "exp"].filter((k) => k in payload).map((k) => `${k}: ${when(payload[k])}`);
    return [
      "HEADER", JSON.stringify(header, null, 2), "", "PAYLOAD", JSON.stringify(payload, null, 2),
      ...(times.length ? ["", "TIMES", ...times] : []), "",
      "SIGNATURE: not verified. Decoding is not validation; never trust claims from an unverified token.",
    ].join("\n");
  },
}];

export default toolFromRecipe(meta.recipe!, blocks, { inputLabel: "Token", outputLabel: "Decoded", outputName: "jwt.txt", inputRows: 5 });
