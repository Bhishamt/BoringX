"use client";
import { useState, type ReactNode } from "react";
import type { BlockDef, Recipe } from "@/engine/types";
import { BlockTool } from "./BlockTool";

type Opts = Partial<Omit<React.ComponentProps<typeof BlockTool>, "recipe" | "blocks">>;

export function toolFromRecipe(recipe: Recipe, blocks: BlockDef[], opts: Opts = {}) {
  return function Tool() {
    return <BlockTool recipe={recipe} blocks={blocks} {...opts} />;
  };
}

/** Same tool, two directions (e.g. CSV to JSON and back). */
export function toolFromRecipes(variants: { label: string; recipe: Recipe; opts?: Opts }[], blocks: BlockDef[]) {
  return function Tool(): ReactNode {
    const [i, setI] = useState(0);
    return (
      <div className="stack">
        <div role="tablist" className="seg" aria-label="Direction">
          {variants.map((v, j) => (
            <button key={v.label} role="tab" aria-selected={i === j} className={`seg-btn ${i === j ? "on" : ""}`} onClick={() => setI(j)} type="button">{v.label}</button>
          ))}
        </div>
        <BlockTool key={i} recipe={variants[i].recipe} blocks={blocks} {...variants[i].opts} />
      </div>
    );
  };
}
