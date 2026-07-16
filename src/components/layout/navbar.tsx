"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import GlobalSearch from "@/components/GlobalSearch";

const primaryLinks = [
  { label: "Rankings", href: "/rankings" },
  { label: "Matches", href: "/matches" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Tournaments", href: "/tournaments" },
];

const secondaryLinks = [
  { label: "Compare", href: "/compare" },
  { label: "Data & methodology", href: "/data" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="pr-nav">
      <div className="pr-container flex h-[72px] items-center justify-between gap-8">
        <Link href="/" className="relative z-10 shrink-0" aria-label="PlayRank home">
          <Image
            src="/brand/playrank-logo.png"
            alt="PlayRank"
            width={154}
            height={52}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {primaryLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={`pr-nav-link ${active ? "is-active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={() => setSearchOpen(true)} className="pr-icon-button" aria-label="Search PlayRank">
            <Search size={17} strokeWidth={2} />
          </button>
          <Link href="/compare" className="pr-button pr-button-primary h-10 px-5 text-[11px]">
            Compare
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={() => { setMenuOpen(false); setSearchOpen(true); }} className="pr-icon-button" aria-label="Search PlayRank">
            <Search size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="pr-icon-button pr-mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="absolute inset-x-0 top-full h-[calc(100dvh-72px)] overflow-y-auto border-t border-white/10 bg-[var(--pr-bg)] lg:hidden">
          <nav className="pr-container grid gap-0 py-4 pb-10" aria-label="Mobile navigation">
            {[...primaryLinks, ...secondaryLinks].map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between border-b border-white/8 py-4 text-base font-semibold text-white"
              >
                <span>{link.label}</span>
                <span className="text-xs text-white/30">{String(index + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      {searchOpen ? (
        <GlobalSearch forceOpen onRequestClose={() => setSearchOpen(false)} />
      ) : null}
    </header>
  );
}
