import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";

type Tone = "healthy" | "warning" | "danger" | "neutral";
type Status = "Protected" | "Live";

type AdminModule = {
  title: string;
  label: string;
  description: string;
  href: string;
  status: Status;
  tone: Tone;
  group: "System" | "PUBG Pipeline" | "Content Ops" | "Public Review";
};

const adminModules: AdminModule[] = [
  {
    title: "Data Health",
    label: "Quality Console",
    description:
      "Check table counts, missing logos, broken slugs, orphan rankings, import health and promotion readiness.",
    href: "/admin/data-health",
    status: "Protected",
    tone: "healthy",
    group: "System",
  },
  {
    title: "Roster Health",
    label: "Integrity Guard",
    description:
      "Audit player-team sync, active roster records and PUBG promotion safety.",
    href: "/admin/rosters/health",
    status: "Protected",
    tone: "healthy",
    group: "System",
  },
  {
    title: "PUBG Hub",
    label: "API Control",
    description:
      "Central PUBG API control hub for imports, staging data, mappings, promotion readiness and import jobs.",
    href: "/admin/pubg",
    status: "Protected",
    tone: "warning",
    group: "PUBG Pipeline",
  },
  {
    title: "Import Match",
    label: "Staging Import",
    description:
      "Import PUBG API match data into staging without touching public PlayRank core tables.",
    href: "/admin/pubg/import",
    status: "Protected",
    tone: "warning",
    group: "PUBG Pipeline",
  },
  {
    title: "PUBG Imports",
    label: "Import Review",
    description:
      "Review imported API matches, blocked imports, mapped players and promotion eligibility.",
    href: "/admin/pubg/imports",
    status: "Protected",
    tone: "warning",
    group: "PUBG Pipeline",
  },
  {
    title: "PUBG Mappings",
    label: "Player Mapping",
    description:
      "Map PUBG account IDs and imported player names to verified PlayRank player records.",
    href: "/admin/pubg/mappings",
    status: "Protected",
    tone: "warning",
    group: "PUBG Pipeline",
  },
  {
    title: "Teams",
    label: "Team Ops",
    description:
      "Manage team records, short names, logos, slugs, source data and team profile coverage.",
    href: "/admin/teams",
    status: "Protected",
    tone: "neutral",
    group: "Content Ops",
  },
  {
    title: "Players",
    label: "Player Ops",
    description:
      "Manage player records, team links, roles, slugs, source data and profile coverage.",
    href: "/admin/players",
    status: "Protected",
    tone: "neutral",
    group: "Content Ops",
  },
  {
    title: "Rosters",
    label: "Roster Ops",
    description:
      "Link players to teams through active roster records and keep player team IDs synchronized.",
    href: "/admin/rosters",
    status: "Protected",
    tone: "neutral",
    group: "Content Ops",
  },
  {
    title: "Matches",
    label: "Match Ops",
    description:
      "Manage structured match records powering PlayRank match intelligence.",
    href: "/admin/matches",
    status: "Protected",
    tone: "neutral",
    group: "Content Ops",
  },
  {
    title: "Tournaments",
    label: "Event Ops",
    description:
      "Manage tournament records, event pages, standings context and tournament metadata.",
    href: "/admin/tournaments",
    status: "Protected",
    tone: "neutral",
    group: "Content Ops",
  },
  {
    title: "Data Trust",
    label: "Source Layer",
    description:
      "Review public-facing source context, imports, official data notes and ranking trust layer.",
    href: "/data",
    status: "Live",
    tone: "healthy",
    group: "Public Review",
  },
  {
    title: "Rankings",
    label: "Competitive Order",
    description:
      "View active team and player rankings powering the public ranking experience.",
    href: "/rankings",
    status: "Live",
    tone: "healthy",
    group: "Public Review",
  },
  {
    title: "Compare",
    label: "Edge Engine",
    description:
      "Open team and player comparison flows for competitive edge analysis.",
    href: "/compare",
    status: "Live",
    tone: "healthy",
    group: "Public Review",
  },
];

const groups: AdminModule["group"][] = [
  "System",
  "PUBG Pipeline",
  "Content Ops",
  "Public Review",
];

function toneClass(tone: Tone) {
  if (tone === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/55";
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          tone === "healthy"
            ? "text-emerald-300"
            : tone === "warning"
              ? "text-yellow-300"
              : tone === "danger"
                ? "text-red-300"
                : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AdminModuleRow({ item }: { item: AdminModule }) {
  return (
    <Link
      href={item.href}
      className="group block rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.045]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
              {item.label}
            </p>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClass(
                item.tone
              )}`}
            >
              {item.status}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-white">{item.title}</h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            {item.description}
          </p>
        </div>

        <span className="shrink-0 text-sm font-black text-white/25 transition group-hover:text-[#ffd21a]">
          Open
        </span>
      </div>
    </Link>
  );
}

function GroupSection({
  title,
  items,
}: {
  title: string;
  items: AdminModule[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
            Module Group
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/45">
          {items.length}
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <AdminModuleRow key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const protectedModules = adminModules.filter(
    (module) => module.status === "Protected"
  ).length;

  const liveModules = adminModules.filter(
    (module) => module.status === "Live"
  ).length;

  const warningModules = adminModules.filter(
    (module) => module.tone === "warning"
  ).length;

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Internal Console" size="md" />
                <DataSourceBadge label="Protected" size="md" />
                <DataSourceBadge label="PlayRank Ops" size="md" />
              </div>

              <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                Admin Control
                <br />
                Center
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Manage PlayRank’s data health, PUBG API pipeline, mappings,
                teams, players, rosters, matches, tournaments and public review
                routes from one protected console.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/data-health"
                  className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                >
                  Data Health
                </Link>

                <Link
                  href="/admin/pubg"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  PUBG Hub
                </Link>

                <Link
                  href="/admin/pubg/mappings"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Mappings
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Modules" value={adminModules.length} />
              <Stat label="Protected" value={protectedModules} tone="warning" />
              <Stat label="Live Review" value={liveModules} tone="healthy" />
              <Stat label="Needs Care" value={warningModules} tone="warning" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-2">
        {groups.map((group) => (
          <GroupSection
            key={group}
            title={group}
            items={adminModules.filter((module) => module.group === group)}
          />
        ))}
      </section>

      <section className="border-t border-white/10 bg-[#050609]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-white">
              Admin rule: raw imports should not reach public tables without
              source control, mapping and promotion checks.
            </p>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/40">
              Keep staging, mappings, promotion readiness and public analytics
              separate until the data is safe to publish.
            </p>
          </div>

          <Link
            href="/data"
            className="text-sm font-black text-white/40 transition hover:text-[#ffd21a]"
          >
            Review Data Trust
          </Link>
        </div>
      </section>
    </main>
  );
}