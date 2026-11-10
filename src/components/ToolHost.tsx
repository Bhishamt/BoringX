"use client";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { loaders } from "@/generated/loaders";

const comps = Object.fromEntries(
  Object.entries(loaders).map(([slug, load]) => [slug, dynamic(load, { loading: () => <p className="help">Loading tool.</p> })]),
);

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <p role="alert" className="note-error">This tool hit an error: {this.state.error.message}. Reload the page and try again; your files were not uploaded anywhere.</p>;
    return this.props.children;
  }
}

export function ToolHost({ slug }: { slug: string }) {
  const C = comps[slug];
  return <Boundary><C /></Boundary>;
}
