"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { tools } from "@/lib/tools";

export function ThemeToggle() {
  const [t, setT] = useState<"light" | "dark">("light");
  useEffect(() => { setT(document.documentElement.dataset.theme === "dark" ? "dark" : "light"); }, []);
  return (
    <button type="button" className="btn" aria-label={`Switch to ${t === "dark" ? "light" : "dark"} theme`} onClick={() => {
      const n = t === "dark" ? "light" : "dark"; setT(n); document.documentElement.dataset.theme = n;
      try { localStorage.setItem("boringx.theme", n); } catch { /* storage unavailable */ }
    }}>{t === "dark" ? "Light" : "Dark"}</button>
  );
}

export function SearchButton() {
  return <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("boringx:palette"))}>Search <kbd>⌘K</kbd></button>;
}

export function Header() {
  return (
    <header className="site-head">
      <Link href="/" className="logo"><span className="boring">Boring</span><span className="logo-x">X</span></Link>
      <nav aria-label="Main" className="nav">
        <Link href="/sandbox" className="navlink">Sandbox</Link>
        <Link href="/about" className="navlink">About</Link>
        <SearchButton />
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:" || location.hostname === "localhost") navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

const HARD = new Set(tools.filter((t) => t.hardNav).map((t) => "/" + t.slug));
/** Pages with their own CSP must be loaded (and left) with a real navigation, not a client-side route change. */
export function HardNav() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.hash) return;
      if (HARD.has(u.pathname) || document.documentElement.dataset.hard) { e.preventDefault(); e.stopPropagation(); location.assign(u.href); }
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
