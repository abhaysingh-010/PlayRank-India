"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import GlobalSearch from "@/components/GlobalSearch";

const primaryLinks = [
  { label: "Rankings", href: "/rankings" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Compare", href: "/compare" },
];

const secondaryLinks = [
  { label: "Data", href: "/data" },
  { label: "Methodology", href: "/methodology" },
  { label: "About", href: "/about" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Standings", href: "/standings" },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[rgba(5,9,20,0.82)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-6 lg:px-8">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex shrink-0 items-center"
            aria-label="PlayRank home"
          >
            <Image
              src="/brand/playrank-logo.png"
              alt="PlayRank"
              width={172}
              height={40}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary navigation"
          >
            {primaryLinks.map((link) => {
              const active = isRouteActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                      : "text-[var(--text-secondary)] hover:bg-white/[0.035] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden xl:block">
              <GlobalSearch />
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white/[0.025] text-[var(--text-secondary)] transition hover:border-[var(--border-medium)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)] xl:hidden"
              aria-label="Open search"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white/[0.025] text-[var(--text-secondary)] transition hover:border-[var(--border-medium)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)] lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-[72px] z-40 max-h-[calc(100vh-72px)] overflow-y-auto border-b border-[var(--border-soft)] bg-[rgba(5,9,20,0.98)] px-4 py-5 backdrop-blur-2xl lg:hidden"
        >
          <nav
            className="mx-auto max-w-[1440px]"
            aria-label="Mobile navigation"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {primaryLinks.map((link) => {
                const active = isRouteActive(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-[var(--border-strong)] bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                        : "border-[var(--border-soft)] bg-white/[0.02] text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 border-t border-[var(--border-soft)] pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                More
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-white/[0.035] hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      ) : null}

      {searchOpen ? (
        <GlobalSearch forceOpen onRequestClose={() => setSearchOpen(false)} />
      ) : null}
    </>
  );
}
