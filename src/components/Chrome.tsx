"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  return <button type="button" className="btn" onClick={() => window.dispatchEvent(new Event("boringx:palette"))} aria-label="Search tools (Command K)">Search <kbd>⌘K</kbd></button>;
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
