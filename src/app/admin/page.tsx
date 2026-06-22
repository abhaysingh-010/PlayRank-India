import Link from "next/link";

const adminModules = 
[
  {
    title: "Data Health",
    label: "Quality Console",
    description:"Check table counts, missing logos, broken slugs, orphan rankings, import health and PUBG promotion readiness.",
    href: "/admin/data-health",
    status: "Protected",
    tone: "healthy",
  },
  {
    title: "PUBG Hub",
    label: "API Control",
    description:"Central PUBG API control hub for imports, staging data, mappings, promotion readiness and import jobs.",
    href: "/admin/pubg",
    status: "Protected",
    tone: "warning",
  },
  {
    title: "PUBG Imports",
    label: "Import Review",
    description:"Review imported PUBG API matches, blocked imports, mapped players and promotion eligibility.",
    href: "/admin/pubg/imports",
    status: "Protected",
    tone: "warning",
  },
  {
    title: "PUBG Mappings",
    label: "Player Mapping",
    description:"Map PUBG account IDs and imported player names to verified PlayRank player records.",
    href: "/admin/pubg/mappings",
    status: "Protected",
    tone: "warning",
  },
  {
    title: "Admin Matches",
    label: "Match Ops",
    description:"Manage and inspect structured match records powering PlayRank match intelligence.",
    href: "/admin/matches",
    status: "Protected",
    tone: "neutral",
  },
  {
    title: "Admin Players",
    label: "Player Ops",
    description:"Manage player records, team links, roles, slugs, source data and profile coverage.",
    href: "/admin/players",
    status: "Protected",
    tone: "neutral",
  },
  {
    title: "Admin Tournaments",
    label: "Event Ops",
    description:"Manage tournament records, event pages, standings context and tournament metadata.",
    href: "/admin/tournaments",
    status: "Protected",
    tone: "neutral",
  },
   {
    title: "Admin Teams",
    label: "Team Ops",
    description:"Manage team records, short names, logos, slugs, source data and team profile coverage.",
    href: "/admin/teams",
    status: "Protected",
    tone: "neutral",
  },
  {
    title: "Admin Rosters",
    label: "Roster Ops",
    description:"Link players to teams through active roster records and keep player team IDs synchronized.",
    href: "/admin/rosters",
    status: "Protected",
    tone: "neutral",
  },
  {
    title: "Data Trust Layer",
    label: "Source Control",
    description:"Review official rankings, PUBG API foundation, source rows, imports and ranking history.",
    href: "/data",
    status: "Live",
    tone: "healthy",
  },
  {
    title: "Rankings",
    label: "Competitive Order",
    description:"View active team and player rankings powering the public ranking experience.",
    href: "/rankings",
    status: "Live",
    tone: "healthy",
  },
  {
    title: "Compare",
    label: "Edge Engine",
    description:"Open team and player comparison flows for competitive edge analysis.",
    href: "/compare",
    status: "Live",
    tone: "healthy",
  },
  {
    title: "Roster Health",
    label: "Integrity Guard",
    description:
      "Audit player-team sync, active roster records and PUBG promotion safety.",
    href: "/admin/rosters/health",
    status: "Protected",
    tone: "healthy",
  },
];

function statusClasses(tone: string) {
  if (tone === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/60";
}

function AdminModuleCard({
  item,
  index,
}: {
  item: {
    title: string;
    label: string;
    description: string;
    href: string;
    status: string;
    tone: string;
  };
  index: number;
}) {
  const tone = statusClasses(item.tone);

  return (
    <Link href={item.href} className="krafton-card group min-h-[300px] p-7">
      <div className="flex items-start justify-between gap-5">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-[#ff4038]">
          {item.label}
        </p>

        <span className="text-sm font-black text-white/30">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h2 className="mt-8 text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-white">
        {item.title}
      </h2>

      <p className="mt-6 max-w-sm leading-7 text-white/50">
        {item.description}
      </p>

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone}`}
        >
          {item.status}
        </span>

        <span className="text-sm font-black uppercase tracking-[0.18em] text-white/45 group-hover:text-[#ff4038]">
          Open -&gt;
        </span>
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const protectedModules = adminModules.filter(
    (module) => module.status === "Protected"
  ).length;

  const liveModules = adminModules.filter(
    (module) => module.status === "Live"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="krafton-grid relative overflow-hidden border-b border-white/10 px-7 py-24 md:px-14">
        <div className="blueprint-lines" />

        <div className="relative z-10 mx-auto max-w-[1600px]">
          <p className="krafton-label">Internal Console</p>

          <h1 className="krafton-display mt-6 max-w-[1450px] text-[15vw] md:text-[9vw] xl:text-[8rem]">
            ADMIN
            <br />
            CONTROL
            <br />
            CENTER
          </h1>

          <p className="mt-8 max-w-4xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white md:text-xl">
            Manage PlayRank's intelligence system from one internal access
            point: data health, PUBG imports, player mappings, rankings, teams,
            players, matches, tournaments and comparison flows.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/admin/data-health"
              className="btn-primary px-6 py-3 text-sm"
            >
              Data Health
            </Link>

            <Link
              href="/admin/pubg"
              className="btn-secondary px-6 py-3 text-sm"
            >
              PUBG Admin Hub
            </Link>

            <Link
              href="/admin/pubg/imports"
              className="btn-secondary px-6 py-3 text-sm"
            >
              PUBG Imports
            </Link>

            <Link
              href="/admin/pubg/mappings"
              className="btn-secondary px-6 py-3 text-sm"
            >
              PUBG Mappings
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div>
            <p className="data-label">Console</p>
            <p className="mt-2 text-5xl font-black text-white">01</p>
          </div>

          <div>
            <p className="data-label">Modules</p>
            <p className="mt-2 text-5xl font-black text-white">
              {adminModules.length}
            </p>
          </div>

          <div>
            <p className="data-label">Protected</p>
            <p className="mt-2 text-5xl font-black text-yellow-300">
              {protectedModules}
            </p>
          </div>

          <div>
            <p className="data-label">Live</p>
            <p className="mt-2 text-5xl font-black text-emerald-300">
              {liveModules}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">System Modules</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Admin Shortcuts
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {adminModules.map((item, index) => (
            <AdminModuleCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-12 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="krafton-label">Operating Rule</p>

            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              Protect
              <br />
              The
              <br />
              Source
            </h2>
          </div>

          <div className="max-w-5xl">
            <p className="text-2xl font-black uppercase leading-8 tracking-[-0.04em] text-white md:text-4xl md:leading-[1.05]">
              PlayRank should never mix raw imports, normalized staging records
              and public analytics without source control.
            </p>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/50">
              The admin layer exists to keep the product clean: protect import
              endpoints, verify counts, monitor broken relationships, review
              official ranking snapshots, map imported player identities and
              block unsafe PUBG data before it reaches core PlayRank tables.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}