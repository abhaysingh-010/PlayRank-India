import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";
import MethodologySection from "@/components/MethodologySection";

type CountResult = {
  label: string;
  value: number;
  description: string;
  badgeLabel: string;
  source?: string | null;
  verified?: boolean | null;
};

const trustLayers = [
  {
    label: "Official Layer",
    title: "Krafton India Rankings",
    badge: "Official Krafton Source",
    description:
      "PlayRank stores official Krafton India team rankings as a source-controlled competitive truth layer.",
  },
  {
    label: "Identity Layer",
    title: "Verified Teams & Aliases",
    badge: "Verified Records",
    description:
      "Team identities, short names, slugs, logo paths and aliases are normalized so search, rankings and profiles stay consistent.",
  },
  {
    label: "Performance Layer",
    title: "Match & Player Data",
    badge: "Analytics Input",
    description:
      "Matches, team results and player stats are structured into performance tables for analysis and comparison.",
  },
  {
    label: "History Layer",
    title: "Ranking Snapshots",
    badge: "Ranking Snapshot",
    description:
      "Ranking history snapshots make movement, trends and rank changes measurable over time.",
  },
  {
    label: "API Layer",
    title: "PUBG API Foundation",
    badge: "PUBG API Data",
    description:
      "PUBG API imports are stored separately from product tables so raw data, normalized data and product data remain traceable.",
  },
  {
    label: "Quality Layer",
    title: "Import Control",
    badge: "Raw Import Control",
    description:
      "Import batches, source metadata and raw imports help protect against broken data, duplicates and unclear origins.",
  },
];

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DataMetric({ item }: { item: CountResult }) {
  return (
    <div className="krafton-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="data-label">{item.label}</p>

        <DataSourceBadge
          source={item.source}
          verified={item.verified}
          label={item.badgeLabel}
        />
      </div>

      <p className="mt-4 text-5xl font-black tracking-[-0.06em] text-white">
        {item.value.toLocaleString("en-IN")}
      </p>

      <p className="mt-4 max-w-sm leading-7 text-white/50">
        {item.description}
      </p>
    </div>
  );
}

export default async function DataPage() {
  const [
    teamsResult,
    playersResult,
    matchesResult,
    tournamentsResult,
    rankingsResult,
    rankingHistoryResult,
    kraftonRankingsResult,
    aliasesResult,
    rawImportsResult,
    pubgMatchesResult,
    pubgParticipantsResult,
    dataSourcesResult,
    importBatchesResult,
    latestSnapshotResult,
  ] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("rankings").select("*", { count: "exact", head: true }),
    supabase.from("ranking_history").select("*", { count: "exact", head: true }),
    supabase
      .from("krafton_team_rankings")
      .select("*", { count: "exact", head: true }),
    supabase.from("team_aliases").select("*", { count: "exact", head: true }),
    supabase
      .from("raw_esports_imports")
      .select("*", { count: "exact", head: true }),
    supabase.from("pubg_api_matches").select("*", { count: "exact", head: true }),
    supabase
      .from("pubg_api_participants")
      .select("*", { count: "exact", head: true }),
    supabase.from("data_sources").select("*", { count: "exact", head: true }),
    supabase.from("import_batches").select("*", { count: "exact", head: true }),
    supabase
      .from("ranking_history")
      .select("snapshot_date, created_at")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const productCounts: CountResult[] = [
    {
      label: "Teams",
      value: n(teamsResult.count),
      description:
        "Verified and normalized team records used across rankings and profiles.",
      badgeLabel: "Verified Team Records",
      verified: true,
    },
    {
      label: "Players",
      value: n(playersResult.count),
      description:
        "Player records connected to roles, teams, stats and profile pages.",
      badgeLabel: "Player Records",
    },
    {
      label: "Matches",
      value: n(matchesResult.count),
      description:
        "Structured match records powering match center and match intelligence pages.",
      badgeLabel: "Analytics Input",
    },
    {
      label: "Tournaments",
      value: n(tournamentsResult.count),
      description:
        "Tournament records used for event pages, standings and historical context.",
      badgeLabel: "Event Records",
    },
  ];

  const dataCounts: CountResult[] = [
    {
      label: "Active Rankings",
      value: n(rankingsResult.count),
      description: "Current ranking rows for teams and players.",
      badgeLabel: "Ranking Snapshot",
    },
    {
      label: "Ranking History",
      value: n(rankingHistoryResult.count),
      description: "Historical snapshots used for rank movement and trend analysis.",
      badgeLabel: "Snapshot History",
    },
    {
      label: "Krafton Rankings",
      value: n(kraftonRankingsResult.count),
      description: "Official Krafton India team ranking rows stored as source data.",
      badgeLabel: "Official Krafton Source",
      source: "krafton_india_esports",
      verified: true,
    },
    {
      label: "Team Aliases",
      value: n(aliasesResult.count),
      description: "Alias records used to match team names across sources and formats.",
      badgeLabel: "Identity Mapping",
    },
  ];

  const importCounts: CountResult[] = [
    {
      label: "Raw Imports",
      value: n(rawImportsResult.count),
      description: "Raw imported payloads kept for traceability and debugging.",
      badgeLabel: "Raw Import",
    },
    {
      label: "PUBG Matches",
      value: n(pubgMatchesResult.count),
      description: "PUBG API match records stored before product-level analysis.",
      badgeLabel: "PUBG API Data",
      source: "pubg_api",
    },
    {
      label: "PUBG Participants",
      value: n(pubgParticipantsResult.count),
      description:
        "PUBG API participant rows used for player and roster normalization.",
      badgeLabel: "PUBG API Data",
      source: "pubg_api",
    },
    {
      label: "Import Batches",
      value: n(importBatchesResult.count),
      description: "Import batch records for tracking ingestion runs and source control.",
      badgeLabel: "Import Control",
    },
  ];

  const latestSnapshotDate =
    latestSnapshotResult.data?.snapshot_date ||
    latestSnapshotResult.data?.created_at ||
    null;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="krafton-grid relative min-h-[calc(100vh-82px)] overflow-hidden">
        <div className="blueprint-lines" />

        <div className="absolute left-[45%] top-[24%] hidden h-[420px] w-[420px] border border-white/20 opacity-25 lg:block" />
        <div className="absolute left-[48%] top-[37%] hidden h-[280px] w-[520px] -skew-x-12 border border-white/20 opacity-25 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-82px)] max-w-[1600px] flex-col justify-center px-7 py-20 md:px-14">
          <p className="krafton-label">Data Trust Layer</p>

          <h1 className="krafton-display mt-6 max-w-[1500px] text-[17vw] md:text-[11vw] xl:text-[10rem]">
            TRUST
            <br />
            THE
            <br />
            SOURCE
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            <DataSourceBadge
              source="krafton_india_esports"
              verified
              label="Official Krafton Source"
              size="md"
            />

            <DataSourceBadge label="Ranking Snapshot" size="md" />

            <DataSourceBadge
              source="pubg_api"
              label="PUBG API Data"
              size="md"
            />

            <DataSourceBadge label="Raw Import Control" size="md" />
          </div>

          <div className="mt-8 flex max-w-5xl items-start gap-6">
            <p className="max-w-4xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white md:text-xl">
              PlayRank separates source data, imported data, normalized records
              and product analytics so every ranking, profile and match view has
              a traceable foundation.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/rankings" className="btn-primary px-6 py-3 text-sm">
              View Rankings
            </Link>

            <Link href="/matches" className="btn-secondary px-6 py-3 text-sm">
              View Matches
            </Link>

            <Link
              href="/admin/data-health"
              className="btn-secondary px-6 py-3 text-sm"
            >
              Data Health
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="data-label">Source Rows</p>
              <DataSourceBadge
                source="krafton_india_esports"
                verified
                label="Official"
              />
            </div>

            <p className="mt-2 text-5xl font-black text-white">
              {n(kraftonRankingsResult.count).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="data-label">Ranking History</p>
              <DataSourceBadge label="Snapshot" />
            </div>

            <p className="mt-2 text-5xl font-black text-white">
              {n(rankingHistoryResult.count).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="data-label">Raw Imports</p>
              <DataSourceBadge label="Import" />
            </div>

            <p className="mt-2 text-5xl font-black text-white">
              {n(rawImportsResult.count).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="data-label">Latest Snapshot</p>
              <DataSourceBadge label="Ranking Snapshot" />
            </div>

            <p className="mt-2 text-3xl font-black text-white">
              {formatDate(latestSnapshotDate)}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="krafton-label">Data Foundation</p>
            <DataSourceBadge label="Normalized Records" />
          </div>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Product Records
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {productCounts.map((item) => (
            <DataMetric key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 border-b border-white/10 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="krafton-label">Ranking Source Control</p>
              <DataSourceBadge
                source="krafton_india_esports"
                verified
                label="Official Krafton Ranking"
              />
            </div>

            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
              Ranking Data
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {dataCounts.map((item) => (
              <DataMetric key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="krafton-label">Import Pipeline</p>
            <DataSourceBadge label="Raw Import Control" />
            <DataSourceBadge source="pubg_api" label="PUBG API Data" />
          </div>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Raw And API Data
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {importCounts.map((item) => (
            <DataMetric key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-12 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="krafton-label">Trust Model</p>

            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              How Data
              <br />
              Becomes
              <br />
              Intelligence
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {trustLayers.map((item, index) => (
              <div key={item.title} className="krafton-card p-6">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-black uppercase tracking-[0.28em] text-[#ff4038]">
                    {item.label}
                  </p>

                  <span className="text-sm font-black text-white/30">
                    0{index + 1}
                  </span>
                </div>

                <div className="mt-5">
                  <DataSourceBadge
                    label={item.badge}
                    verified={item.badge.toLowerCase().includes("official")}
                    source={
                      item.badge.toLowerCase().includes("pubg")
                        ? "pubg_api"
                        : item.badge.toLowerCase().includes("krafton")
                        ? "krafton_india_esports"
                        : undefined
                    }
                  />
                </div>

                <h3 className="mt-8 text-3xl font-black uppercase leading-[0.95] tracking-[-0.055em] text-white">
                  {item.title}
                </h3>

                <p className="mt-5 leading-7 text-white/50">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <MethodologySection />
      </section>
      
      <section className="krafton-grid relative overflow-hidden px-7 py-20 text-center md:px-14">
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="krafton-label">PlayRank Data Layer</p>

          <h2 className="krafton-title mt-4 text-6xl text-white md:text-8xl">
            Build Trust
            <br />
            Before Insight
          </h2>

          <div className="mt-6 flex justify-center">
            <DataSourceBadge label="Admin Health Shortcut" size="md" />
          </div>

          <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/50">
            Every product page should clearly separate official source data,
            normalized records and analytics output.
          </p>

          <div className="mt-9 flex justify-center gap-3">
            <Link href="/rankings" className="btn-primary px-6 py-3 text-sm">
              View Rankings
            </Link>

            <Link href="/teams" className="btn-secondary px-6 py-3 text-sm">
              Explore Teams
            </Link>

            <Link
              href="/admin/data-health"
              className="btn-secondary px-6 py-3 text-sm"
            >
              Data Health
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}