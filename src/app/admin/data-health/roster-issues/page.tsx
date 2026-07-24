import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type RosterHealthRow = {
  player_id: string | null;
  health_status: string | null;
  promotion_safe: boolean | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string | null;
  team_id: string | null;
  role: string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
  created_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  slug: string | null;
  short_name: string | null;
};

type RosterIssue = {
  health: RosterHealthRow;
  player: PlayerRow | null;
  team: TeamRow | null;
  priority: {
    label: string;
    className: string;
  };
  reason: string;
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(value: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPlayerSourceLabel(player: PlayerRow | null) {
  if (!player) return "Missing Player";
  if (player.source === "krafton_india_esports") return "Official Krafton";
  if (player.source === "pubg_api") return "PUBG API";
  if (player.source === "admin_manual") return "Admin Manual";
  if (player.verified) return "Verified Player";
  return "Player Record";
}

function getIssueReason(row: RosterHealthRow, player: PlayerRow | null) {
  if (!player) return "Roster health points to a missing player record.";

  if (row.promotion_safe !== true) {
    return "Player roster link is not safe for PUBG promotion.";
  }

  if (!row.health_status) {
    return "Roster health status is missing.";
  }

  if (!["healthy", "ok", "valid"].includes(row.health_status.toLowerCase())) {
    return `Roster health status is ${formatStatus(row.health_status)}.`;
  }

  return "Roster record needs review.";
}

function getPriority(row: RosterHealthRow, player: PlayerRow | null) {
  if (!player) {
    return {
      label: "Critical",
      className: "border-red-400/25 bg-red-400/10 text-red-300",
    };
  }

  if (row.promotion_safe === false) {
    return {
      label: "High",
      className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
    };
  }

  if (!row.health_status) {
    return {
      label: "Review",
      className: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    };
  }

  return {
    label: "Review",
    className: "border-white/10 bg-white/[0.04] text-white/55",
  };
}

function getRosterHealthHref(status: string | null) {
  if (!status) {
    return "/admin/rosters/health?status=issues";
  }

  return `/admin/rosters/health?status=${encodeURIComponent(status)}`;
}

function getPlayerReviewHref(player: PlayerRow | null) {
  if (!player?.ign) {
    return "/admin/rosters/health?status=issues";
  }

  return `/admin/players?search=${encodeURIComponent(player.ign)}`;
}
function isRosterIssue(row: RosterHealthRow) {
  const status = row.health_status?.toLowerCase() || "";

  return (
    row.promotion_safe !== true ||
    !status ||
    !["healthy", "ok", "valid"].includes(status)
  );
}

export default async function RosterIssuesPage() {
  const { data: healthRaw, error: healthError } = await supabaseAdmin
    .from("player_roster_health")
    .select("player_id, health_status, promotion_safe")
    .limit(1000);

  const healthRows = ((healthRaw || []) as RosterHealthRow[]).filter(
    isRosterIssue,
  );

  const playerIds = Array.from(
    new Set(
      healthRows
        .map((row) => row.player_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { data: playersRaw, error: playersError } =
    playerIds.length > 0
      ? await supabaseAdmin
          .from("players")
          .select(
            "id, ign, slug, team_id, role, source, verified, active, created_at",
          )
          .in("id", playerIds)
      : { data: [], error: null };

  const players = (playersRaw || []) as PlayerRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));

  const teamIds = Array.from(
    new Set(
      players
        .map((player) => player.team_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const { data: teamsRaw, error: teamsError } =
    teamIds.length > 0
      ? await supabaseAdmin
          .from("teams")
          .select("id, name, slug, short_name")
          .in("id", teamIds)
      : { data: [], error: null };

  const teams = (teamsRaw || []) as TeamRow[];
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const error = healthError || playersError || teamsError;

  const issues: RosterIssue[] = healthRows.map((health) => {
    const player = health.player_id
      ? playerById.get(health.player_id) || null
      : null;
    const team = player?.team_id ? teamById.get(player.team_id) || null : null;

    return {
      health,
      player,
      team,
      priority: getPriority(health, player),
      reason: getIssueReason(health, player),
    };
  });

  const criticalCount = issues.filter(
    (issue) => issue.priority.label === "Critical",
  ).length;

  const highCount = issues.filter(
    (issue) => issue.priority.label === "High",
  ).length;

  const promotionUnsafeCount = issues.filter(
    (issue) => issue.health.promotion_safe !== true,
  ).length;

  const missingPlayerCount = issues.filter((issue) => !issue.player).length;

  if (error) {
    return (
      <main className="page-shell py-10 text-white">
        <section className="border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Admin Data Health
          </p>
          <h1 className="mt-3 text-3xl font-black">Roster Issues</h1>
          <p className="mt-3 text-red-200/80">
            Failed to load roster health records.
          </p>
          <p className="mt-2 text-sm text-red-200/55">{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="border border-white/10 bg-[#07080c] p-7 md:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Admin Data Health" />
              <DataSourceBadge label="Roster Issues" />
              <DataSourceBadge label="Promotion Safety" />
              <DataSourceBadge label="Roster Integrity" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Data Issue Detail
            </p>

            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Roster
              <br />
              Issues
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              These records failed roster health checks or are not safe for PUBG
              promotion. Fixing these protects player identity mapping, team
              attribution, rankings, and core promotion integrity.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Open Issues
              </p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">
                {issues.length.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Critical
              </p>
              <p className="mt-2 text-3xl font-black text-red-300">
                {criticalCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                High Priority
              </p>
              <p className="mt-2 text-3xl font-black text-yellow-300">
                {highCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Promotion Unsafe
              </p>
              <p className="mt-2 text-3xl font-black">
                {promotionUnsafeCount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/admin/data-health"
            className="pr-button pr-button-secondary"
          >
            Back to Data Health
          </Link>
          <Link
            href="/admin/rosters/health"
            className="pr-button pr-button-primary"
          >
            Roster Health
          </Link>
          <Link href="/admin/rosters" className="pr-button pr-button-secondary">
            Rosters
          </Link>
          <Link
            href="/admin/pubg/mappings"
            className="pr-button pr-button-secondary"
          >
            PUBG Mappings
          </Link>
        </div>
      </section>

      <section className="border border-yellow-400/20 bg-yellow-400/[0.06] p-6">
        <div className="flex flex-wrap gap-2">
          <DataSourceBadge label="Promotion Guard" />
          <DataSourceBadge label="Manual Review Required" />
          <DataSourceBadge label="Identity Safety" />
        </div>

        <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em]">
          Roster issues should block promotion
        </h2>

        <p className="mt-3 max-w-5xl text-sm leading-7 text-white/55">
          Unsafe roster records should not be promoted into PlayRank core data.
          Resolve player identity, team ownership, and roster-health mismatches
          before using imported PUBG match data for public analytics.
        </p>
      </section>

      <section className="overflow-hidden border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Affected Roster Records</h2>
          <p className="mt-2 text-sm text-white/45">
            Review critical and high-priority issues first. Missing player
            references usually indicate stale health rows or deleted records.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Promotion Safe</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {issues.length > 0 ? (
                issues.map((issue, index) => (
                  <tr
                    key={`${issue.health.player_id || "missing"}-${index}`}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      <p className="font-black text-white">
                        {issue.player?.ign || "Missing Player"}
                      </p>
                      <p className="mt-1 font-mono text-xs text-white/35">
                        {issue.health.player_id || "no-player-id"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      {issue.team ? (
                        <div>
                          <p className="font-bold text-white">
                            {issue.team.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">
                            {issue.team.short_name || "TEAM"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-white/35">No team linked</span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/60">
                        {formatStatus(issue.health.health_status)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      {issue.health.promotion_safe === true ? (
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                          Safe
                        </span>
                      ) : (
                        <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                          Unsafe
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={issue.player?.source}
                        verified={issue.player?.verified}
                        label={getPlayerSourceLabel(issue.player)}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${issue.priority.className}`}
                      >
                        {issue.priority.label}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-white/55">
                      {issue.reason}
                    </td>

                    <td className="px-6 py-5 text-white/45">
                      {formatDate(issue.player?.created_at || null)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={getPlayerReviewHref(issue.player)}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                        >
                          Review
                        </Link>

                        <Link
                          href={getRosterHealthHref(issue.health.health_status)}
                          className="rounded-full border border-[#ffd21a]/20 bg-[#ffd21a]/10 px-4 py-2 text-sm font-bold text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                        >
                          Filter
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-lg font-black text-emerald-300">
                      No roster issues found.
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                      Roster health records are currently promotion-safe.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {missingPlayerCount > 0 ? (
          <div className="border-t border-red-400/20 bg-red-400/[0.04] p-5">
            <p className="text-sm text-red-200/80">
              {missingPlayerCount.toLocaleString("en-IN")} roster health record
              references a missing player. Review stale health rows or deleted
              player records.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
