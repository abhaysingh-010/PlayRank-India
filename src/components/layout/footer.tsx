import Link from "next/link";

const productLinks = 
[
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
  { label: "Matches", href: "/matches" },
  { label: "Rankings", href: "/rankings" },
  { label: "Compare", href: "/compare" },
  { label: "Tournaments", href: "/tournaments" },
];

const dataLinks = 
[
  { label: "Data Trust Layer", href: "/data" },
  { label: "Official Rankings", href: "/rankings" },
  { label: "Team Database", href: "/teams" },
  { label: "Player Database", href: "/players" },
  { label: "Match Intelligence", href: "/matches" },
  { label: "Data Health", href: "/admin/data-health" },
];

const companyLinks = 
[
  { label: "About PlayRank", href: "/about" },
  { label: "Admin Console", href: "/admin" },
  { label: "Esports Intelligence", href: "/compare" },
  { label: "Contact", href: "/" },
  { label: "Privacy", href: "/" },
];

function FooterColumn
(
    {title,links,}
    : 
    {
        title: string;
        links: 
        {
            label: string;
            href: string;
        }[];
    }
)   
{
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
        {title}
      </p>

      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="block text-sm font-semibold text-white/55 transition hover:text-[#ff4038]"
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
    <footer className="border-t border-white/10 bg-black px-7 py-16 text-white md:px-14">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <img
                src="/brand/playrank-logo.png"
                alt="PlayRank"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
              India’s esports intelligence platform for rankings, teams,
              players, matches, tournaments and competitive comparison.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="rounded-full bg-[#ff4038] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-white"
              >
                View Rankings
              </Link>

              <Link
                href="/compare"
                className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-[#ff4038] hover:text-[#ff4038]"
              >
                Compare
              </Link>
            </div>
          </div>
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Data" links={dataLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>
        
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
            © {new Date().getFullYear()} PlayRank. All rights reserved.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Built for India’s competitive esports ecosystem.</p>
        </div>
      </div>
      <br />
      <p className="max-w-3xl text-xs leading-6 text-white/35">
        PlayRank is an independent esports analytics platform. Official rankings and
        source data are attributed where available. PlayRank is not an official
        Krafton product.
      </p>
    </footer>
  );
}