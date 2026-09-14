"use client";

import Link from "next/link";
import Image from "next/image";
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

  return <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header standalone-header">
    <Link className="files-logo" href="/" aria-label="The Files With Dub home"><Image src="/files-with-dub-globe-logo.png" alt="The Files With Dub" width={96} height={96} priority /></Link>
    <nav className={menu ? "nav-open" : ""} aria-label="Primary navigation">
      {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setMenu(false)}>{label}</Link>)}
    </nav>
    <div className="header-actions"><a className="shop-link header-button" href="https://9p7whp-1k.myshopify.com" target="_blank" rel="noreferrer" aria-label="Open the Files store"><span>Store</span><span className="action-arrow" aria-hidden="true">↗</span></a><Link className="book-button header-button" href="/studio" aria-label="Book the studio"><span>Book the studio</span><span className="action-arrow" aria-hidden="true">↗</span></Link><button className="menu-button" onClick={() => setMenu(!menu)} aria-label={menu ? "Close navigation" : "Open navigation"} aria-expanded={menu}>☰</button></div>
    </header>
  </>;
}
