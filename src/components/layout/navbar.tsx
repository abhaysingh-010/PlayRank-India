"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GlobalSearch from "@/components/GlobalSearch";

const links = [
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Rankings", href: "/rankings" },
  { label: "Compare", href: "/compare" },
  { label: "About", href: "/about" },
  { label: "Data", href: "/data" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-[9999] border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] max-w-[1600px] items-center justify-between px-7 md:px-14">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/brand/playrank-logo.png"
            alt="PlayRank"
            width={180}
            height={40}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-black uppercase tracking-[0.14em] transition ${
                  isActive
                    ? "text-[#ff4038]"
                    : "text-white/65 hover:text-[#ff4038]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden w-[360px] justify-end xl:flex">
          {!isHome ? <GlobalSearch /> : null}
        </div>

        <Link
          href="/rankings"
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-[#ff4038] hover:text-[#ff4038] lg:hidden"
        >
          Rankings
        </Link>
      </div>
    </header>
  );
}