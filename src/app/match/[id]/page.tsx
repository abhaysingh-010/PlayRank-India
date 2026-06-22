import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TeamMini = {
  id: string;
  name: string;
  slug: string;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

type TournamentMini = {
  id: string;
  name: string;
  slug: string;
};

type MatchRow = {
  id: string;
  tournament_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  source: string | null;
  source_url: string | null;
  verified: boolean | null;
  created_at: string | null;
  team1: TeamMini | null;
  team2: TeamMini | null;
  winner: TeamMini | null;
};

type MatchRowRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & {
  team1: TeamMini | TeamMini[] | null;
  team2: TeamMini | TeamMini[] | null;
  winner: TeamMini | TeamMini[] | null;
};

type PlayerMini = {
  id: string;
  ign: string;
  slug: string;
};

type PlayerStatRow = {
  id: string | number;
  player_id: string;
  match_id: string;
  kills: number | null;
  damage: number | null;
  placement: number | null;
  knocks?: number | null;
  assists?: number | null;
  revives?: number | null;
  survival_time?: number | null;
  is_mvp?: boolean | null;
  mvp?: boolean | null;
  player: PlayerMini | null;
};

type PlayerStatRaw = Omit<PlayerStatRow, "player"> & {
  player: PlayerMini | PlayerMini[] | null;
};

type TeamStatRow = {
  id: string | number;
  team_id: string;
  match_id: string;
  placement: number | null;
  kills: number | null;
  placement_points: number | null;
  kill_points: number | null;
  total_points: number | null;
  survival_time?: number | null;
  team: TeamMini | null;
};

type TeamStatRaw = Omit<TeamStatRow, "team"> & {
  team: TeamMini | TeamMini[] | null;
};

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(value: string | null) {
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMinutes(seconds: unknown) {
  const safeSeconds = n(seconds);
  if (!safeSeconds) return "0m";
  return `${Math.floor(safeSeconds / 60)}m`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getTeamBadgeLabel(team?: TeamMini | null) {
  if (!team) return "Team Record";
  if (team.source === "krafton_india_esports") return "Official Krafton Team";
  if (team.verified) return "Verified Team";
  return "Team Record";
}

function getMatchSourceLabel(source: string | null, verified: boolean | null) {
  if (source === "pubg_developer_api") return "PUBG API Promoted";
  if (source === "pubg_api") return "PUBG API";
  if (source === "krafton_india_esports") return "Official Krafton Source";
  if (verified) return "Verified Match";
  return "Match Record";
}

function Metric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div className={softCard + " p-4"}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          muted ? "text-white/65" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TeamIdentity({
  team,
  align = "left",
  winner = false,
}: {
  team: TeamMini | null;
  align?: "left" | "right";
  winner?: boolean;
}) {
  const teamName = team?.name || "Team N/A";

  return (
    <div
      className={`flex min-w-0 items-center gap-4 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
          winner
            ? "border-[#ffd21a]/30 bg-[#ffd21a]/10 text-[#ffd21a]"
            : "border-white/10 bg-white/[0.04] text-white/65"
        }`}
      >
        <span className="text-lg font-black">{getInitials(teamName)}</span>
      </div>

      <div className="min-w-0">
        {team?.slug ? (
          <Link
            href={`/teams/${team.slug}`}
            className="truncate text-2xl font-black text-white hover:underline"
          >
            {teamName}
          </Link>
        ) : (
          <p className="truncate text-2xl font-black text-white">{teamName}</p>
        )}

        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">
          {winner ? "Winner" : "Team"}
        </p>

        <div
          className={`mt-2 flex flex-wrap gap-2 ${
            align === "right" ? "justify-end" : ""
          }`}
        >
          <DataSourceBadge
            source={team?.source}
            verified={team?.verified}
            label={getTeamBadgeLabel(team)}
          />
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const safeValue = clamp(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className="font-bold text-white/80">{safeValue}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#ffd21a]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: matchRaw, error: matchError } = await supabase
    .from("matches")
    .select(
      `
      id,
      tournament_id,
      team1_id,
      team2_id,
      winner_team_id,
      team1_score,
      team2_score,
      map_name,
      stage,
      date,
      source,
      source_url,
      verified,
      created_at,
      team1:team1_id (
        id,
        name,
        slug,
        source,
        verified,
        active
      ),
      team2:team2_id (
        id,
        name,
        slug,
        source,
        verified,
        active
      ),
      winner:winner_team_id (
        id,
        name,
        slug,
        source,
        verified,
        active
      )
    `
    )
    .eq("id", id)
    .single();

  if (matchError || !matchRaw) {
    notFound();
  }

  const rawMatch = matchRaw as MatchRowRaw;

  const match: MatchRow = {
    ...rawMatch,
    team1: one(rawMatch.team1),
    team2: one(rawMatch.team2),
    winner: one(rawMatch.winner),
  };

  const [playerStatsResult, teamStatsResult, tournamentResult] =
    await Promise.all([
      supabase
        .from("player_match_stats")
        .select(
          `
          id,
          player_id,
          match_id,
          kills,
          damage,
          placement,
          knocks,
          assists,
          revives,
          survival_time,
          is_mvp,
          mvp,
          player:player_id (
            id,
            ign,
            slug
          )
        `
        )
        .eq("match_id", id)
        .order("kills", { ascending: false }),

      supabase
        .from("team_match_results")
        .select(
          `
          id,
          team_id,
          match_id,
          placement,
          kills,
          placement_points,
          kill_points,
          total_points,
          survival_time,
          team:team_id (
            id,
            name,
            slug,
            source,
            verified,
            active
          )
        `
        )
        .eq("match_id", id)
        .order("total_points", { ascending: false }),

      match.tournament_id
        ? supabase
            .from("tournaments")
            .select("id,name,slug")
            .eq("id", match.tournament_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const playerStats = ((playerStatsResult.data || []) as PlayerStatRaw[]).map(
    (row) => ({
      ...row,
      player: one(row.player),
    })
  ) as PlayerStatRow[];

  const teamStats = ((teamStatsResult.data || []) as TeamStatRaw[]).map(
    (row) => ({
      ...row,
      team: one(row.team),
    })
  ) as TeamStatRow[];

  const tournament = tournamentResult.data as TournamentMini | null;

  const team1Score = n(match.team1_score);
  const team2Score = n(match.team2_score);
  const scoreTotal = team1Score + team2Score;
  const scoreDiff = Math.abs(team1Score - team2Score);

  const totalPlayerKills = playerStats.reduce(
    (sum, row) => sum + n(row.kills),
    0
  );

  const totalTeamKills = teamStats.reduce((sum, row) => sum + n(row.kills), 0);
  const totalKills = totalPlayerKills || totalTeamKills;

  const totalDamage = playerStats.reduce(
    (sum, row) => sum + n(row.damage),
    0
  );

  const longestSurvival = Math.max(
    0,
    ...playerStats.map((row) => n(row.survival_time)),
    ...teamStats.map((row) => n(row.survival_time))
  );

  const explicitMvp = playerStats.find((row) => row.is_mvp || row.mvp);

  const topPlayer =
    explicitMvp ||
    [...playerStats].sort((a, b) => {
      const aScore = n(a.kills) * 100 + n(a.damage);
      const bScore = n(b.kills) * 100 + n(b.damage);
      return bScore - aScore;
    })[0] ||
    null;

  const topTeam =
    [...teamStats].sort((a, b) => n(b.total_points) - n(a.total_points))[0] ||
    null;

  const fightIntensity = clamp(Math.round(totalKills * 5));
  const damagePressure = clamp(Math.round(totalDamage / 45));
  const survivalIndex = clamp(Math.round(longestSurvival / 18));
  const scoreTension = scoreTotal > 0 ? clamp(100 - scoreDiff * 10) : 0;

  const isHeadToHead = Boolean(match.team1 || match.team2);
  const matchFormat = isHeadToHead ? "Head-to-Head" : "Battle Royale";

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10">
          <div className="mb-7 flex flex-wrap gap-2">
            <DataSourceBadge
              source={match.source}
              verified={match.verified}
              label={getMatchSourceLabel(match.source, match.verified)}
              size="md"
            />

            <DataSourceBadge label={matchFormat} size="md" />
            <DataSourceBadge label="Match Intelligence" size="md" />
            <DataSourceBadge label="Analytics Generated" size="md" />

            {tournament ? (
              <DataSourceBadge label="Tournament Record" size="md" />
            ) : null}
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_240px_1fr] xl:items-center">
            <TeamIdentity
              team={match.team1}
              winner={match.winner_team_id === match.team1_id}
            />

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                {match.stage || "Match"}
              </p>

              <p className="mt-3 text-5xl font-black tracking-[-0.08em] text-white">
                {team1Score}
                <span className="mx-3 text-white/25">:</span>
                {team2Score}
              </p>

              <p className="mt-3 text-sm text-white/45">
                {match.map_name || "Map TBD"} · {formatDate(match.date)}
              </p>

              {tournament ? (
                <Link
                  href={`/tournaments/${tournament.slug}`}
                  className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/55 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                >
                  {tournament.name}
                </Link>
              ) : null}
            </div>

            <TeamIdentity
              team={match.team2}
              align="right"
              winner={match.winner_team_id === match.team2_id}
            />
          </div>

          {match.winner ? (
            <div className="mt-7 rounded-2xl border border-[#ffd21a]/20 bg-[#ffd21a]/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd21a]">
                Winner
              </p>

              <Link
                href={`/teams/${match.winner.slug}`}
                className="mt-2 inline-flex text-3xl font-black tracking-[-0.04em] text-white hover:underline"
              >
                {match.winner.name}
              </Link>
            </div>
          ) : topTeam?.team ? (
            <div className="mt-7 rounded-2xl border border-[#ffd21a]/20 bg-[#ffd21a]/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd21a]">
                Top Placement
              </p>

              <Link
                href={`/teams/${topTeam.team.slug}`}
                className="mt-2 inline-flex text-3xl font-black tracking-[-0.04em] text-white hover:underline"
              >
                {topTeam.team.name}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Total Kills" value={totalKills} />
        <Metric label="Total Damage" value={totalDamage} />
        <Metric label="Score Gap" value={scoreDiff} />
        <Metric label="Survival Peak" value={formatMinutes(longestSurvival)} />
        <Metric label="Teams" value={teamStats.length || (isHeadToHead ? 2 : 0)} muted />
        <Metric label="Source" value={getMatchSourceLabel(match.source, match.verified)} muted />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Match DNA
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Performance Channel
              </h2>
            </div>

            <DataSourceBadge label="Analytics Generated" />
          </div>

          <div className="mt-6 space-y-5">
            <Bar label="Fight Intensity" value={fightIntensity} />
            <Bar label="Damage Pressure" value={damagePressure} />
            <Bar label="Survival Index" value={survivalIndex} />
            <Bar label="Score Tension" value={scoreTension} />
          </div>
        </section>

        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Featured Player
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Match MVP Read
              </h2>
            </div>

            <DataSourceBadge label="Player Match Stats" />
          </div>

          {topPlayer?.player ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <Link
                href={`/players/${topPlayer.player.slug}`}
                className="text-3xl font-black tracking-[-0.04em] text-white hover:underline"
              >
                {topPlayer.player.ign}
              </Link>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <Metric label="Kills" value={n(topPlayer.kills)} muted />
                <Metric label="Damage" value={n(topPlayer.damage)} muted />
                <Metric label="Assists" value={n(topPlayer.assists)} muted />
                <Metric label="Revives" value={n(topPlayer.revives)} muted />
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
              No player stats available for this match yet.
            </p>
          )}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Team Results
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Squad Output
              </h2>
            </div>

            <DataSourceBadge label="Team Match Results" />
          </div>

          <div className="mt-6 space-y-3">
            {teamStats.length > 0 ? (
              teamStats.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      {row.team?.slug ? (
                        <Link
                          href={`/teams/${row.team.slug}`}
                          className="text-xl font-black text-white hover:underline"
                        >
                          {row.team.name}
                        </Link>
                      ) : (
                        <p className="text-xl font-black text-white">
                          {row.team?.name || "Team"}
                        </p>
                      )}

                      <div className="mt-2">
                        <DataSourceBadge
                          source={row.team?.source}
                          verified={row.team?.verified}
                          label={getTeamBadgeLabel(row.team)}
                        />
                      </div>
                    </div>

                    <span className="rounded-full border border-[#ffd21a]/25 bg-[#ffd21a]/10 px-4 py-1 text-sm font-black text-[#ffd21a]">
                      #{row.placement || "—"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-white/30">Kills</p>
                      <p className="font-black text-white">{n(row.kills)}</p>
                    </div>

                    <div>
                      <p className="text-white/30">Placement Pts</p>
                      <p className="font-black text-white">
                        {n(row.placement_points)}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/30">Kill Pts</p>
                      <p className="font-black text-white">
                        {n(row.kill_points)}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/30">Total</p>
                      <p className="font-black text-[#ffd21a]">
                        {n(row.total_points)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                No team result rows available for this match yet.
              </p>
            )}
          </div>
        </section>

        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Intelligence Verdict
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Match Read
              </h2>
            </div>

            <DataSourceBadge label="Analytics Generated" />
          </div>

          <p className="mt-5 leading-7 text-white/60">
            This match produced{" "}
            <span className="font-bold text-white">{totalKills}</span> total
            kills and{" "}
            <span className="font-bold text-white">{totalDamage}</span> total
            damage.{" "}
            {topTeam?.team ? (
              <>
                <span className="font-bold text-[#ffd21a]">
                  {topTeam.team.name}
                </span>{" "}
                led the squad output with{" "}
                <span className="font-bold text-white">
                  {n(topTeam.total_points)}
                </span>{" "}
                total points.
              </>
            ) : (
              "Team output data is still limited for this match."
            )}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Metric label="Fight Intensity" value={`${fightIntensity}%`} muted />
            <Metric label="Score Tension" value={`${scoreTension}%`} muted />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Data Context
            </p>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Match detail uses normalized match, team result and player stat
              tables. PUBG API records only appear here after controlled
              promotion into PlayRank core tables.
            </p>
          </div>
        </section>
      </section>

      <section className={card + " overflow-hidden"}>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Player Stats
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Match Stat Sheet
            </h2>
          </div>

          <DataSourceBadge label="Player Match Stats" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">Damage</th>
                <th className="px-6 py-4 text-right">Knocks</th>
                <th className="px-6 py-4 text-right">Assists</th>
                <th className="px-6 py-4 text-right">Revives</th>
                <th className="px-6 py-4 text-right">Survival</th>
              </tr>
            </thead>

            <tbody>
              {playerStats.length > 0 ? (
                playerStats.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      {row.player?.slug ? (
                        <Link
                          href={`/players/${row.player.slug}`}
                          className="font-bold text-white hover:underline"
                        >
                          {row.player.ign}
                        </Link>
                      ) : (
                        <span className="font-bold text-white">
                          Player N/A
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-right font-black text-white">
                      {n(row.kills)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {n(row.damage)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {n(row.knocks)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {n(row.assists)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {n(row.revives)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {formatMinutes(row.survival_time)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-white/45"
                  >
                    No player stats available for this match yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}