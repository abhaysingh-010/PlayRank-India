import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CountCard = {
  label: string;
  value: number;
  status: "healthy" | "warning" | "danger" | "neutral";
  description: string;
};

type IssueCard = {
  label: string;
  value: number;
  status: "healthy" | "warning" | "danger";
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

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function safeCount(table: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    count: n(count),
    error: error?.message || null,
  };
}

function statusClass(status: CountCard["status"] | IssueCard["status"]) {
  if (status === "healthy") {
    return {
      border: "border-emerald-400/25",
      text: "text-emerald-300",
      bg: "bg-emerald-400/10",
    };
  }

  if (status === "warning") {
    return {
      border: "border-yellow-400/25",
      text: "text-yellow-300",
      bg: "bg-yellow-400/10",
    };
  }

  if (status === "danger") {
    return {
      border: "border-red-400/30",
      text: "text-red-300",
      bg: "bg-red-400/10",
    };
  }

  return {
    border: "border-white/10",
    text: "text-white/70",
    bg: "bg-white/[0.04]",
  };
}

function HealthCard({ item }: { item: CountCard }) {
  const tone = statusClass(item.status);

  return (
    <div className={`krafton-card p-6 ${tone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="data-label">{item.label}</p>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.border} ${tone.bg} ${tone.text}`}
        >
          {item.status}
        </span>
      </div>

      <p className="mt-5 text-5xl font-black tracking-[-0.06em] text-white">
        {item.value.toLocaleString("en-IN")}
      </p>

      <p className="mt-4 leading-7 text-white/50">{item.description}</p>
    </div>
  );
}

function IssueCardView({ item }: { item: IssueCard }) {
  const tone = statusClass(item.status);

  const content = (
    <div className={`krafton-card p-6 ${tone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="data-label">{item.label}</p>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.border} ${tone.bg} ${tone.text}`}
        >
          {item.status}
        </span>
      </div>

      <p className={`mt-5 text-5xl font-black tracking-[-0.06em] ${tone.text}`}>
        {item.value.toLocaleString("en-IN")}
      </p>

      <p className="mt-4 leading-7 text-white/50">{item.description}</p>
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
  const status: CountCard["status"] =
    readyForPromotion > 0
      ? "healthy"
      : totalImportedMatches > 0
        ? "warning"
        : "neutral";

  const tone = statusClass(status);

  return (
    <div className={`krafton-card p-6 ${tone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="data-label">PUBG Import Readiness</p>

          <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
            Promotion Gate
          </h3>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.border} ${tone.bg} ${tone.text}`}
        >
          {readyForPromotion > 0 ? "ready" : blocked > 0 ? "blocked" : "neutral"}
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">Imported</p>

          <p className="mt-3 text-4xl font-black text-white">
            {totalImportedMatches.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="data-label text-emerald-300">Ready</p>

          <p className="mt-3 text-4xl font-black text-emerald-300">
            {readyForPromotion.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="data-label text-yellow-300">Blocked</p>

          <p className="mt-3 text-4xl font-black text-yellow-300">
            {blocked.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {latest ? (
        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="data-label">Latest Imported Match</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                External Match
              </p>

              <p className="mt-2 break-all text-sm font-black text-white">
                {latest.external_match_id}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                Map / Mode
              </p>

              <p className="mt-2 text-sm font-black text-white">
                {latest.map_name || "Unknown"} /{" "}
                {latest.game_mode || "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                Mapped Players
              </p>

              <p className="mt-2 text-sm font-black text-white">
                {latest.mapped_players || 0} /{" "}
                {latest.total_participants || 0}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                Mapped Teams
              </p>

              <p className="mt-2 text-sm font-black text-white">
                {latest.mapped_teams || 0}
              </p>
            </div>
          </div>

          <div className="mt-6 border border-yellow-400/20 bg-yellow-400/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
              Promotion Status
            </p>

            <p className="mt-2 text-sm font-black uppercase text-white">
              {(latest.promotion_status || "unknown").replace(/_/g, " ")}
            </p>

            <p className="mt-3 text-sm leading-6 text-white/55">
              This match will stay in PUBG staging tables until enough players
              are mapped to verified PlayRank players and teams.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-white/50">
          No PUBG API match imports found yet.
        </p>
      )}
    </div>
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
      description:
        "Primary team records used across rankings, profiles and comparison pages.",
    },
    {
      label: "Players",
      value: players.count,
      status: players.count > 0 ? "healthy" : "warning",
      description:
        "Player records used for profile pages, rankings and player comparison.",
    },
    {
      label: "Roster Healthy",
      value: rosterHealthy,
      status: rosterHealthIssues === 0 ? "healthy" : "warning",
      description:
        "Players with synced player.team_id and active roster team.",
    },
    {
      label: "Promotion Safe Players",
      value: rosterPromotionSafe,
      status: rosterPromotionSafe > 0 ? "healthy" : "warning",
      description:
        "Players safe for PUBG/player identity promotion workflows.",
    },
    {
      label: "Matches",
      value: matches.count,
      status: matches.count > 0 ? "healthy" : "warning",
      description:
        "Match records powering match center and match intelligence pages.",
    },
    {
      label: "Tournaments",
      value: tournaments.count,
      status: tournaments.count > 0 ? "healthy" : "warning",
      description:
        "Tournament records powering event, standings and context pages.",
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
      description:
        "Official Krafton India ranking source rows stored in PlayRank.",
    },
    {
      label: "Team Aliases",
      value: teamAliases.count,
      status: teamAliases.count > 0 ? "healthy" : "warning",
      description:
        "Alias coverage used for name matching and source normalization.",
    },
    {
      label: "Raw Imports",
      value: rawImports.count,
      status: rawImports.count > 0 ? "healthy" : "neutral",
      description:
        "Raw import payloads retained for traceability and debugging.",
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
      description:
        "PUBG API match records stored before product-level normalization.",
    },
    {
      label: "PUBG API Participants",
      value: pubgParticipants.count,
      status: pubgParticipants.count > 0 ? "healthy" : "neutral",
      description:
        "PUBG API participant rows stored in staging before PlayRank promotion.",
    },
  ];

  const issueCards: IssueCard[] = [
    {
      label: "Roster Health Issues",
      value: rosterHealthIssues,
      status: rosterHealthIssues === 0 ? "healthy" : "danger",
      description:
        "Player/team roster mismatches that can block PUBG promotion safety.",
      href: "/admin/rosters/health",
    },
    {
      label: "Missing Team Logos",
      value: missingLogoCount,
      status: missingLogoCount === 0 ? "healthy" : "warning",
      description:
        "Teams without logo_url. These will fall back to initials in UI.",
      href: "/teams",
    },
    {
      label: "Teams Without Slug",
      value: missingTeamSlugCount,
      status: missingTeamSlugCount === 0 ? "healthy" : "danger",
      description: "Teams without slugs break team profile URLs.",
      href: "/teams",
    },
    {
      label: "Players Without Team",
      value: playersWithoutTeamCount,
      status: playersWithoutTeamCount === 0 ? "healthy" : "warning",
      description:
        "Players not linked to a team. This weakens profile and comparison context.",
      href: "/players",
    },
    {
      label: "Orphan Rankings",
      value: orphanRankings.length,
      status: orphanRankings.length === 0 ? "healthy" : "danger",
      description:
        "Ranking rows whose entity_id does not match a team or player record.",
      href: "/rankings",
    },
    {
      label: "PUBG Promotion Blocked",
      value: pubgBlockedPromotionCount,
      status: pubgBlockedPromotionCount === 0 ? "healthy" : "warning",
      description:
        "PUBG API matches blocked from core promotion because players or teams are not mapped yet.",
      href: "/admin/pubg/imports",
    },
  ];

  const openIssueCount =
    missingLogoCount +
    missingTeamSlugCount +
    playersWithoutTeamCount +
    orphanRankings.length +
    pubgBlockedPromotionCount +
    rosterHealthIssues;

  const tableErrorEntries: Array<[string, string | null | undefined]> = [
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

  const tableErrors = tableErrorEntries.filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="krafton-grid relative overflow-hidden border-b border-white/10 px-7 py-24 md:px-14">
        <div className="blueprint-lines" />

        <div className="relative z-10 mx-auto max-w-[1600px]">
          <p className="krafton-label">Admin Console</p>

          <h1 className="krafton-display mt-6 max-w-[1450px] text-[15vw] md:text-[9vw] xl:text-[8rem]">
            DATA
            <br />
            HEALTH
            <br />
            CONTROL
          </h1>

          <p className="mt-8 max-w-4xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white md:text-xl">
            Internal quality console for PlayRank&apos;s teams, players,
            rankings, match data, source imports and PUBG API foundation.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/data" className="btn-primary px-6 py-3 text-sm">
              View Trust Layer
            </Link>

            <Link href="/rankings" className="btn-secondary px-6 py-3 text-sm">
              View Rankings
            </Link>

            <Link href="/admin/pubg" className="btn-secondary px-6 py-3 text-sm">
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

            <Link
              href="/admin/rosters/health"
              className="btn-secondary px-6 py-3 text-sm"
            >
              Roster Health
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-black px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div>
            <p className="data-label">Product Records</p>

            <p className="mt-2 text-5xl font-black text-white">
              {(
                teams.count +
                players.count +
                matches.count +
                tournaments.count
              ).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="data-label">Ranking Rows</p>

            <p className="mt-2 text-5xl font-black text-white">
              {(rankings.count + rankingHistory.count).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="data-label">Import Rows</p>

            <p className="mt-2 text-5xl font-black text-white">
              {(
                rawImports.count +
                pubgMatches.count +
                pubgParticipants.count
              ).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="data-label">Open Issues</p>

            <p className="mt-2 text-5xl font-black text-[#ff4038]">
              {openIssueCount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">PUBG API Gate</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Import Promotion Readiness
          </h2>
        </div>

        <PubgReadinessPanel
          totalImportedMatches={pubgReadinessRows.length}
          readyForPromotion={pubgReadyForPromotionCount}
          blocked={pubgBlockedPromotionCount}
          latest={latestPubgReadiness}
        />
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-16 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Roster Guard</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Roster Health
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Link
            href="/admin/rosters/health"
            className="krafton-card border-emerald-400/25 p-6"
          >
            <p className="data-label text-emerald-300">Healthy Players</p>

            <p className="mt-3 text-5xl font-black text-emerald-300">
              {rosterHealthy.toLocaleString("en-IN")}
            </p>

            <p className="mt-4 text-sm leading-6 text-white/50">
              Players with clean player/team/roster alignment.
            </p>
          </Link>

          <Link
            href="/admin/rosters/health"
            className="krafton-card border-emerald-400/25 p-6"
          >
            <p className="data-label text-emerald-300">Promotion Safe</p>

            <p className="mt-3 text-5xl font-black text-emerald-300">
              {rosterPromotionSafe.toLocaleString("en-IN")}
            </p>

            <p className="mt-4 text-sm leading-6 text-white/50">
              Players safe for imported PUBG identity and team promotion.
            </p>
          </Link>

          <Link
            href="/admin/rosters/health"
            className={`krafton-card p-6 ${
              rosterHealthIssues === 0
                ? "border-emerald-400/25"
                : "border-red-400/25"
            }`}
          >
            <p
              className={`data-label ${
                rosterHealthIssues === 0
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              Roster Issues
            </p>

            <p
              className={`mt-3 text-5xl font-black ${
                rosterHealthIssues === 0
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {rosterHealthIssues.toLocaleString("en-IN")}
            </p>

            <p className="mt-4 text-sm leading-6 text-white/50">
              Issues that can block promotion safety or corrupt team-linked
              analytics.
            </p>
          </Link>
        </div>

        {rosterHealthResult.error ? (
          <div className="mt-5 border border-red-400/20 bg-red-400/10 p-5">
            <p className="font-black uppercase text-red-300">
              Roster health view error
            </p>

            <p className="mt-2 text-sm text-white/60">
              {rosterHealthResult.error.message}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">System Overview</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Table Health
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {countCards.map((item) => (
            <HealthCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 border-b border-white/10 pb-5">
            <p className="krafton-label">Quality Checks</p>

            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
              Open Data Issues
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {issueCards.map((item) => (
              <IssueCardView key={item.label} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Errors</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Table Access Report
          </h2>
        </div>

        {tableErrors.length > 0 ? (
          <div className="space-y-3">
            {tableErrors.map(([table, error]) => (
              <div
                key={table}
                className="border border-red-400/20 bg-red-400/10 p-5"
              >
                <p className="font-black uppercase tracking-[0.16em] text-red-300">
                  {table}
                </p>

                <p className="mt-2 text-sm text-white/60">{error}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-emerald-400/20 bg-emerald-400/10 p-6">
            <p className="text-xl font-black uppercase tracking-[-0.03em] text-emerald-300">
              No table access errors detected.
            </p>

            <p className="mt-3 text-white/55">
              All checked tables responded successfully.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}