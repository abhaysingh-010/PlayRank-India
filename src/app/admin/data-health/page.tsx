import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Status = "healthy" | "warning" | "danger" | "neutral";

type CountCard = {
  label: string;
  value: number;
  status: Status;
  description: string;
};

type IssueCard = {
  label: string;
  value: number;
  status: Exclude<Status, "neutral">;
  description: string;
  href?: string;
};

type RankingRow = {
  id: string;
  entity_type: "team" | "player" | string;
  entity_id: string;
  rank: number | null;
  score: number | null;
};

type PubgPromotionReadinessRow = {
  external_match_id: string;
  shard: string;
  map_name: string | null;
  game_mode: string | null;
  created_at_api: string | null;
  total_participants: number | null;
  mapped_players: number | null;
  mapped_players_with_team: number | null;
  mapped_teams: number | null;
  mapped_player_percentage: number | null;
  promotion_status: string | null;
  promotion_allowed: boolean | null;
};

type RosterHealthRow = {
  health_status: string | null;
  promotion_safe: boolean | null;
};

type SafeCount = {
  count: number;
  error: string | null;
};

const shell =
  "border border-white/10 bg-[#080a0f] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

const panel =
  "border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function safeCount(table: string): Promise<SafeCount> {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    count: n(count),
    error: error?.message || null,
  };
}

function statusStyle(status: Status) {
  if (status === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (status === "danger") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/55";
}

function statusText(status: Status) {
  if (status === "healthy") return "Healthy";
  if (status === "warning") return "Review";
  if (status === "danger") return "Fix";
  return "Neutral";
}

function formatStatus(value: string | null) {
  return (value || "unknown").replace(/_/g, " ");
}

function StatBlock({
  label,
  value,
  status = "neutral",
}: {
  label: string;
  value: number;
  status?: Status;
}) {
  return (
    <div className={panel + " p-4"}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          status === "healthy"
            ? "text-emerald-300"
            : status === "warning"
              ? "text-yellow-300"
              : status === "danger"
                ? "text-red-300"
                : "text-white"
        }`}
      >
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
          {title}
        </h2>
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="w-fit text-sm font-black text-white/40 transition hover:text-[#ffd21a]"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}

function CountHealthRow({ item }: { item: CountCard }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-white">{item.label}</p>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusStyle(
              item.status
            )}`}
          >
            {statusText(item.status)}
          </span>
        </div>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
          {item.description}
        </p>
      </div>

      <p className="shrink-0 text-3xl font-black text-white">
        {item.value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function IssueRow({ item }: { item: IssueCard }) {
  const content = (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.045] md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-white">{item.label}</p>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusStyle(
              item.status
            )}`}
          >
            {statusText(item.status)}
          </span>
        </div>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
          {item.description}
        </p>
      </div>

      <p
        className={`shrink-0 text-3xl font-black ${
          item.status === "healthy"
            ? "text-emerald-300"
            : item.status === "warning"
              ? "text-yellow-300"
              : "text-red-300"
        }`}
      >
        {item.value.toLocaleString("en-IN")}
      </p>
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

function PubgReadinessPanel({
  totalImportedMatches,
  readyForPromotion,
  blocked,
  latest,
}: {
  totalImportedMatches: number;
  readyForPromotion: number;
  blocked: number;
  latest: PubgPromotionReadinessRow | null;
}) {
  const status: Status =
    readyForPromotion > 0
      ? "healthy"
      : totalImportedMatches > 0
        ? "warning"
        : "neutral";

  return (
    <section className={shell + " p-5 md:p-6"}>
      <SectionHeader
        eyebrow="PUBG API Gate"
        title="Promotion Readiness"
        actionHref="/admin/pubg/imports"
        actionLabel="Open Imports"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatBlock label="Imported Matches" value={totalImportedMatches} />
        <StatBlock label="Ready" value={readyForPromotion} status="healthy" />
        <StatBlock label="Blocked" value={blocked} status={blocked > 0 ? "warning" : "healthy"} />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        {latest ? (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <DataSourceBadge label="Latest Import" />

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusStyle(
                    status
                  )}`}
                >
                  {latest.promotion_allowed ? "Ready" : "Blocked"}
                </span>
              </div>

              <p className="mt-4 break-all text-sm font-black text-white">
                {latest.external_match_id}
              </p>

              <p className="mt-2 text-sm text-white/45">
                {latest.map_name || "Unknown map"} ·{" "}
                {latest.game_mode || "Unknown mode"} · {latest.shard}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatBlock
                label="Players"
                value={n(latest.mapped_players)}
                status={n(latest.mapped_players) > 0 ? "healthy" : "warning"}
              />
              <StatBlock
                label="Total"
                value={n(latest.total_participants)}
              />
              <StatBlock
                label="Teams"
                value={n(latest.mapped_teams)}
                status={n(latest.mapped_teams) > 0 ? "healthy" : "warning"}
              />
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
                Promotion Status
              </p>

              <p className="mt-2 text-sm font-black uppercase text-white">
                {formatStatus(latest.promotion_status)}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/55">
                This match remains in PUBG staging until enough imported player
                identities are mapped to verified PlayRank players and teams.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/45">
            No PUBG API match imports found yet.
          </p>
        )}
      </div>
    </section>
  );
}

export default async function DataHealthPage() {
  const [
    teams,
    players,
    matches,
    tournaments,
    rankings,
    rankingHistory,
    kraftonRankings,
    teamAliases,
    rawImports,
    dataSources,
    importBatches,
    pubgMatches,
    pubgParticipants,
    pubgReadinessResult,
    rosterHealthResult,
    missingLogoResult,
    missingTeamSlugResult,
    playersWithoutTeamResult,
    rankingsRowsResult,
    teamsIdResult,
    playersIdResult,
  ] = await Promise.all([
    safeCount("teams"),
    safeCount("players"),
    safeCount("matches"),
    safeCount("tournaments"),
    safeCount("rankings"),
    safeCount("ranking_history"),
    safeCount("krafton_team_rankings"),
    safeCount("team_aliases"),
    safeCount("raw_esports_imports"),
    safeCount("data_sources"),
    safeCount("import_batches"),
    safeCount("pubg_api_matches"),
    safeCount("pubg_api_participants"),

    supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select("*")
      .order("created_at_api", { ascending: false }),

    supabaseAdmin
      .from("player_roster_health")
      .select("health_status, promotion_safe"),

    supabaseAdmin
      .from("teams")
      .select("id", { count: "exact", head: true })
      .or("logo_url.is.null,logo_url.eq."),

    supabaseAdmin
      .from("teams")
      .select("id", { count: "exact", head: true })
      .or("slug.is.null,slug.eq."),

    supabaseAdmin
      .from("players")
      .select("id", { count: "exact", head: true })
      .is("team_id", null),

    supabaseAdmin
      .from("rankings")
      .select("id, entity_type, entity_id, rank, score")
      .limit(5000),

    supabaseAdmin.from("teams").select("id").limit(5000),

    supabaseAdmin.from("players").select("id").limit(5000),
  ]);

  const missingLogoCount = n(missingLogoResult.count);
  const missingTeamSlugCount = n(missingTeamSlugResult.count);
  const playersWithoutTeamCount = n(playersWithoutTeamResult.count);

  const pubgReadinessRows = (pubgReadinessResult.data ||
    []) as PubgPromotionReadinessRow[];

  const latestPubgReadiness = pubgReadinessRows[0] || null;

  const pubgReadyForPromotionCount = pubgReadinessRows.filter(
    (row) => row.promotion_allowed === true
  ).length;

  const pubgBlockedPromotionCount = pubgReadinessRows.filter(
    (row) => row.promotion_allowed !== true
  ).length;

  const rosterHealthRows = (rosterHealthResult.data || []) as RosterHealthRow[];

  const rosterHealthIssues = rosterHealthRows.filter(
    (row) => row.health_status !== "healthy"
  ).length;

  const rosterPromotionSafe = rosterHealthRows.filter(
    (row) => row.promotion_safe === true
  ).length;

  const rosterHealthy = rosterHealthRows.filter(
    (row) => row.health_status === "healthy"
  ).length;

  const rankingRows = (rankingsRowsResult.data || []) as RankingRow[];

  const teamIds = new Set(
    (teamsIdResult.data || []).map((team: { id: string }) => team.id)
  );

  const playerIds = new Set(
    (playersIdResult.data || []).map((player: { id: string }) => player.id)
  );

  const orphanRankings = rankingRows.filter((ranking) => {
    if (ranking.entity_type === "team") {
      return !teamIds.has(ranking.entity_id);
    }

    if (ranking.entity_type === "player") {
      return !playerIds.has(ranking.entity_id);
    }

    return true;
  });

  const countCards: CountCard[] = [
    {
      label: "Teams",
      value: teams.count,
      status: teams.count > 0 ? "healthy" : "danger",
      description:"Primary team records used across rankings, profiles and comparison pages.",
    },
    {
      label: "Players",
      value: players.count,
      status: players.count > 0 ? "healthy" : "warning",
      description:"Player records used for profile pages, rankings and player comparison.",
    },
    {
      label: "Matches",
      value: matches.count,
      status: matches.count > 0 ? "healthy" : "warning",
      description:"Match records powering match center and match intelligence pages.",
    },
    {
      label: "Tournaments",
      value: tournaments.count,
      status: tournaments.count > 0 ? "healthy" : "warning",
      description:"Tournament records powering event, standings and context pages.",
    },
    {
      label: "Active Rankings",
      value: rankings.count,
      status: rankings.count > 0 ? "healthy" : "danger",
      description: "Current ranking rows for teams and players.",
    },
    {
      label: "Ranking History",
      value: rankingHistory.count,
      status: rankingHistory.count > 0 ? "healthy" : "warning",
      description: "Snapshot rows used to track rank movement over time.",
    },
    {
      label: "Krafton Rankings",
      value: kraftonRankings.count,
      status: kraftonRankings.count > 0 ? "healthy" : "warning",
      description:"Official Krafton India ranking source rows stored in PlayRank.",
    },
    {
      label: "Team Aliases",
      value: teamAliases.count,
      status: teamAliases.count > 0 ? "healthy" : "warning",
      description:"Alias coverage used for name matching and source normalization.",
    },
    {
      label: "Raw Imports",
      value: rawImports.count,
      status: rawImports.count > 0 ? "healthy" : "neutral",
      description:"Raw import payloads retained for traceability and debugging.",
    },
    {
      label: "Data Sources",
      value: dataSources.count,
      status: dataSources.count > 0 ? "healthy" : "neutral",
      description: "Source metadata records for official and imported data.",
    },
    {
      label: "Import Batches",
      value: importBatches.count,
      status: importBatches.count > 0 ? "healthy" : "neutral",
      description: "Batch records for data import and ingestion runs.",
    },
    {
      label: "PUBG API Matches",
      value: pubgMatches.count,
      status: pubgMatches.count > 0 ? "healthy" : "neutral",
      description:"PUBG API match records stored before product-level normalization.",
    },
    {
      label: "PUBG API Participants",
      value: pubgParticipants.count,
      status: pubgParticipants.count > 0 ? "healthy" : "neutral",
      description:"PUBG API participant rows stored in staging before PlayRank promotion.",
    },
  ];

  const issueCards: IssueCard[] = [
    {
      label: "Roster Health Issues",
      value: rosterHealthIssues,
      status: rosterHealthIssues === 0 ? "healthy" : "danger",
      description:"Player/team roster mismatches that can block PUBG promotion safety.",
      href: "/admin/data-health/roster-issues",
    },
    {
      label: "Missing Team Logos",
      value: missingLogoCount,
      status: missingLogoCount === 0 ? "healthy" : "warning",
      description:"Teams without logo_url. These will fall back to initials in UI.",
      href: "/admin/data-health/missing-logos",
    },
    {
      label: "Teams Without Slug",
      value: missingTeamSlugCount,
      status: missingTeamSlugCount === 0 ? "healthy" : "danger",
      description:"Teams without slugs break team profile URLs.",
      href: "/admin/data-health/missing-slugs",
    },
    {
      label: "Players Without Team",
      value: playersWithoutTeamCount,
      status: playersWithoutTeamCount === 0 ? "healthy" : "warning",
      description:"Players not linked to a team. This weakens profile and comparison context.",
      href: "/admin/data-health/players-without-team",
    },
    {
      label: "Orphan Rankings",
      value: orphanRankings.length,
      status: orphanRankings.length === 0 ? "healthy" : "danger",
      description:"Ranking rows whose entity_id does not match a team or player record.",
      href: "/admin/data-health/orphan-rankings",
    },
    {
      label: "PUBG Promotion Blocked",
      value: pubgBlockedPromotionCount,
      status: pubgBlockedPromotionCount === 0 ? "healthy" : "warning",
      description:"PUBG API matches blocked from core promotion because players or teams are not mapped yet.",
      href: "/admin/data-health/pubg-blocked-promotions",
    },
  ];

  const openIssueCount = missingLogoCount + missingTeamSlugCount + playersWithoutTeamCount + orphanRankings.length + pubgBlockedPromotionCount + rosterHealthIssues;
  const tableErrorEntries: Array<[string, string | null | undefined]> = 
  [
    ["teams", teams.error],
    ["players", players.error],
    ["matches", matches.error],
    ["tournaments", tournaments.error],
    ["rankings", rankings.error],
    ["ranking_history", rankingHistory.error],
    ["krafton_team_rankings", kraftonRankings.error],
    ["team_aliases", teamAliases.error],
    ["raw_esports_imports", rawImports.error],
    ["data_sources", dataSources.error],
    ["import_batches", importBatches.error],
    ["pubg_api_matches", pubgMatches.error],
    ["pubg_api_participants", pubgParticipants.error],
    ["pubg_match_promotion_readiness", pubgReadinessResult.error?.message],
    ["player_roster_health", rosterHealthResult.error?.message],
  ];

  const tableErrors = tableErrorEntries
  .filter
  (
    (entry): entry is [string, string] => Boolean(entry[1])
  );

  return (
    <main className="bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Admin Console" size="md" />
                <DataSourceBadge label="Data Health" size="md" />
                <DataSourceBadge label="Protected" size="md" />
              </div>

              <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">
                Integrity monitor / live database checks
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                Data Health
                <br />
                Control
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Internal quality console for PlayRank teams, players, rankings,
                match data, source imports, roster sync and PUBG API staging.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admin/pubg" className="border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd21a] transition hover:bg-[#ffd21a]/15">
                  PUBG Hub
                </Link>
                <Link href="/admin/rosters/health" className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white">
                  Roster Health
                </Link>
                <Link href="/admin/pubg/promotions" className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white">
                  Promotion Audit
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Product Records" value={teams.count + players.count + matches.count + tournaments.count} status="neutral"/>
              <StatBlock label="Ranking Rows" value={rankings.count + rankingHistory.count} status={rankings.count > 0 ? "healthy" : "danger"}/>
              <StatBlock label="Import Rows" value={rawImports.count + pubgMatches.count + pubgParticipants.count} status={pubgMatches.count > 0 ? "healthy" : "neutral"}/>
              <StatBlock label="Open Issues" value={openIssueCount} status={openIssueCount === 0 ? "healthy" : "warning"}/>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1500px] gap-5 px-5 py-10 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <PubgReadinessPanel totalImportedMatches={pubgReadinessRows.length} readyForPromotion={pubgReadyForPromotionCount} blocked={pubgBlockedPromotionCount} latest={latestPubgReadiness} />
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader eyebrow="Roster Guard" title="Roster Promotion Safety" actionHref="/admin/rosters/health" actionLabel="Open Roster Health"/>
          <div className="grid gap-3">
            <StatBlock label="Healthy Players" value={rosterHealthy} status={rosterHealthIssues === 0 ? "healthy" : "warning"}/>
            <StatBlock label="Promotion Safe" value={rosterPromotionSafe} status={rosterPromotionSafe > 0 ? "healthy" : "warning"}/>
            <StatBlock label="Roster Issues"value={rosterHealthIssues} status={rosterHealthIssues === 0 ? "healthy" : "danger"}/>
          </div>
          {rosterHealthResult.error ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="font-black uppercase text-red-300"> Roster health view error</p>
              <p className="mt-2 text-sm text-white/60">{rosterHealthResult.error.message}</p>
            </div>
          ) : null}
        </section>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-5 px-5 pb-10 md:px-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Quality Checks"
            title="Open Data Issues"
          />

          <div className="grid gap-3">
            {issueCards.map((item) => (
              <IssueRow key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="System Overview"
            title="Table Health"
          />

          <div className="grid gap-3">
            {countCards.map((item) => (
              <CountHealthRow key={item.label} item={item} />
            ))}
          </div>
        </section>
      </section>

      <section className="border-t border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
          <SectionHeader eyebrow="Errors" title="Table Access Report" />

          {tableErrors.length > 0 ? (
            <div className="space-y-3">
              {tableErrors.map(([table, error]) => (
                <div
                  key={table}
                  className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
                >
                  <p className="font-black uppercase tracking-[0.16em] text-red-300">
                    {table}
                  </p>

                  <p className="mt-2 text-sm text-white/60">{error}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-lg font-black text-emerald-300">
                No table access errors detected.
              </p>

              <p className="mt-2 text-sm text-white/55">
                All checked tables and health views responded successfully.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
