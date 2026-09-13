"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["Home", "/"],
  ["The Files", "/files"],
  ["X", "/broadcasts"],
  ["Patreon", "/patreon"],
  ["Outside", "/outside"],
  ["Studio", "/studio"],
  ["Consulting", "/consulting"],
  ["Spill", "/spill"],
  ["Shop", "/affiliate"],
  ["Contact", "/contact"],
  ["About", "/about"],
] as const;

export default function SiteNavigation() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menu]);

  return <header className="site-header standalone-header">
    <Link className="files-logo" href="/" aria-label="The Files With Dub home"><span className="files-logo-seal">TF</span><span><strong>THE FILES</strong><em>WITH DUB</em></span></Link>
    <nav className={menu ? "nav-open" : ""} aria-label="Primary navigation">
      {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setMenu(false)}>{label}</Link>)}
    </nav>
    <div className="header-actions"><a className="shop-link" href="https://9p7whp-1k.myshopify.com" target="_blank" rel="noreferrer">Store ↗</a><Link className="book-button" href="/studio">Book the studio ↗</Link><button className="menu-button" onClick={() => setMenu(!menu)} aria-label={menu ? "Close navigation" : "Open navigation"} aria-expanded={menu}>☰</button></div>
  </header>;
}
