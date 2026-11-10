import type { BlockDef } from "./types";
import { builtinBlocks } from "./builtin-blocks";
import { toolBlocks } from "@/generated/blocks";

export const allBlocks: BlockDef[] = [...toolBlocks, ...builtinBlocks];
const map = new Map(allBlocks.map((b) => [b.id, b]));
export const blockById = (id: string) => map.get(id);
