import Link from "next/link";
import { Activity, Database, Gamepad2, ShieldCheck } from "lucide-react";

const links = [
  ["Overview", "/admin"],
  ["Health", "/admin/data-health"],
  ["Rankings", "/admin/rankings-sync"],
  ["PUBG", "/admin/pubg"],
  ["Imports", "/admin/pubg/imports"],
  ["Mappings", "/admin/pubg/mappings"],
  ["Teams", "/admin/teams"],
  ["Players", "/admin/players"],
  ["Rosters", "/admin/rosters"],
  ["Matches", "/admin/matches"],
  ["Events", "/admin/tournaments"],
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#08090b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-5 py-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-[var(--pr-red)]/40 text-[var(--pr-red)]">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[.12em]">
                PlayRank Ops
              </p>
              <p className="text-[9px] uppercase tracking-[.16em] text-white/30">
                Protected console
              </p>
            </div>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white/40 transition hover:bg-white/[.04] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--pr-positive)] xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> Internal
          </div>
        </div>
      </header>
      <div className="border-b border-white/10 bg-white/[.018]">
        <div className="mx-auto flex max-w-[1500px] items-center gap-8 overflow-x-auto px-5 py-2 text-[9px] uppercase tracking-[.14em] text-white/25">
          <span className="inline-flex items-center gap-2">
            <Activity size={12} /> Data operations
          </span>
          <span className="inline-flex items-center gap-2">
            <Database size={12} /> Controlled writes
          </span>
          <span className="inline-flex items-center gap-2">
            <Gamepad2 size={12} /> PUBG staging isolated
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
