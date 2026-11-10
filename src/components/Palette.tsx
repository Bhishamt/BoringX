"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { score, tools } from "@/lib/tools";

type Item = { href: string; name: string; sub: string };
const ALL: Item[] = [{ href: "/sandbox", name: "Sandbox", sub: "Build your own tool" }, { href: "/", name: "Home", sub: "All tools" }, { href: "/about", name: "About", sub: "What this is" }, { href: "/privacy", name: "Privacy", sub: "What happens to your files" },
  ...tools.map((t) => ({ href: `/${t.slug}`, name: t.name, sub: t.blurb }))];

export function Palette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const prev = useRef<HTMLElement | null>(null);

  const items = q.trim()
    ? ALL.map((i) => ({ i, s: tools.find((t) => `/${t.slug}` === i.href) ? score(tools.find((t) => `/${t.slug}` === i.href)!, q) : i.name.toLowerCase().includes(q.toLowerCase()) ? 50 : 0 })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.i).slice(0, 12)
    : ALL.slice(0, 12);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); prev.current = document.activeElement as HTMLElement; setOpen((o) => !o); setQ(""); setSel(0); }
      else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        const hero = document.getElementById("hero-q");
        e.preventDefault();
        if (hero) hero.focus(); else { prev.current = document.activeElement as HTMLElement; setOpen(true); setQ(""); setSel(0); }
      } else if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => { prev.current = document.activeElement as HTMLElement; setOpen(true); setQ(""); setSel(0); };
    window.addEventListener("keydown", onKey); window.addEventListener("boringx:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("boringx:palette", onOpen); };
  }, []);
  useEffect(() => { if (open) input.current?.focus(); else prev.current?.focus?.(); }, [open]);

  if (!open) return null;
  const go = (i: Item) => { setOpen(false); router.push(i.href); };
  return (
    <div className="palette-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input ref={input} className="mono" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant={`pal-${sel}`} placeholder="Go to a tool" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            else if (e.key === "Enter" && items[sel]) go(items[sel]);
            else if (e.key === "Enter" && !items.length && q.trim()) { setOpen(false); router.push(`/sandbox#n=${encodeURIComponent(q.trim())}`); }
          }} />
        <ul id="pal-list" role="listbox" className="ledger">
          {items.map((i, k) => <li key={i.href} id={`pal-${k}`} role="option" aria-selected={k === sel} className={`ledger-row pal-row ${k === sel ? "sel" : ""}`} onMouseEnter={() => setSel(k)} onClick={() => go(i)}><span className="tool-name">{i.name}</span><span className="tool-blurb">{i.sub}</span></li>)}
          {!items.length && <li className="ledger-row">Nothing matches. Press Enter to build Boring {q.trim()}.</li>}
        </ul>
      </div>
    </div>
  );
}
