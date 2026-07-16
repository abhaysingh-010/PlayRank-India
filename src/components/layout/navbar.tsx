"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
          <Link href="/search" className="pr-icon-button" aria-label="Search PlayRank">
            <Search size={17} strokeWidth={2} />
          </Link>
          <Link href="/compare" className="pr-button pr-button-primary h-10 px-5 text-[11px]">
            Compare
          </Link>
        </div>

        <button
          type="button"
          className="pr-icon-button lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[var(--pr-bg)] lg:hidden">
          <nav className="pr-container grid gap-0 py-4" aria-label="Mobile navigation">
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
    </header>
  );
}
