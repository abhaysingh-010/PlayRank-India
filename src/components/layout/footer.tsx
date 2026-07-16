import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { label: "Rankings", href: "/rankings" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Compare", href: "/compare" },
];

const resourceLinks = [
  { label: "Data", href: "/data" },
  { label: "Methodology", href: "/methodology" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Standings", href: "/standings" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Search", href: "/search" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {title}
      </p>

      <div className="mt-4 space-y-3">
        {links.map((link) => (
          <Link
            key={`${title}-${link.href}`}
            href={link.href}
            className="block text-sm text-[var(--text-secondary)] transition hover:text-[var(--brand-hover)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-soft)] bg-[var(--background-deep)]">
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="PlayRank home"
            >
              <Image
                src="/brand/playrank-logo.png"
                alt="PlayRank"
                width={168}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
              India&apos;s esports intelligence platform for competitive
              rankings, verified team and player records, match context, and
              data-led comparison.
            </p>

            <Link
              href="/rankings"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-medium)] bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand-hover)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(139,163,197,0.16)]"
            >
              Explore rankings
            </Link>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        <div className="mt-12 border-t border-[var(--border-soft)] pt-6">
          <p className="max-w-5xl text-xs leading-6 text-[var(--text-subtle)]">
            PlayRank is an independent esports intelligence platform and is not
            affiliated with, endorsed by, or operated by Krafton, PUBG, BGMI,
            or tournament organisers. Official source data is attributed where
            available. PlayRank rankings and analytics are independently
            calculated from available competitive data.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border-soft)] pt-6 text-xs text-[var(--text-subtle)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} PlayRank. All rights reserved.</p>
          <p>Built for India&apos;s competitive esports ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
