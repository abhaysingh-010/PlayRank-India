import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RankHistoryChart from "@/components/RankHistoryChart";

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  global_rank: number | null;
  source: string | null;
  source_url: string | null;
  verified: boolean | null;
  active: boolean | null;
  created_at: string | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  recent_form: string | null;
};

type AchievementRow = {
  id: string;
  title: string;
  tournament_name: string | null;
  placement: string | null;
  year: number | null;
};

type RankHistoryRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  rank: number;
  score: number;
  snapshot_date: string;
  created_at: string | null;
};

type RecentMatchRow = {
  id: string;
  team1_id: string;
  team2_id: string;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1: { name: string } | null;
  team2: { name: string } | null;
  winner: { name: string } | null;
};

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatValue(value: unknown, decimals = 0) {
  const safe = n(value);
  return decimals > 0 ? safe.toFixed(decimals) : Math.round(safe).toString();
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

function TeamLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-3"
        />
      ) : (
        <span className="text-2xl font-black tracking-tight text-white">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function DataSourceBadge({
  source,
  verified,
  label,
}: {
  source: string | null;
  verified: boolean | null;
  label?: string;
}) {
  const displayLabel =
    label ||
    (source === "krafton_india_esports"
      ? "Official Krafton Team"
      : verified
      ? "Verified Team"
      : "PlayRank");

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ffd21a]" />
      {displayLabel}
    </span>
  );
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

function Bar({ label, value }: { label: string; value: number }) {
  const safeValue = clamp(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className="font-bold text-white/80">{safeValue}</span>
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

function calculateMovement(history: RankHistoryRow[]) {
  if (!history || history.length < 2) {
    return {
      movement: 0,
      previousRank: history?.[0]?.rank ?? null,
      currentRank: history?.[0]?.rank ?? null,
      direction: "Stable",
    };
  }

  const previous = history[history.length - 2];
  const current = history[history.length - 1];
  const movement = previous.rank - current.rank;

  return {
    movement,
    previousRank: previous.rank,
    currentRank: current.rank,
    direction: movement > 0 ? "Rising" : movement < 0 ? "Dropping" : "Stable",
  };
}

function getArchetype({
  powerScore,
  firepower,
  winOutput,
  consistency,
}: {
  powerScore: number;
  firepower: number;
  winOutput: number;
  consistency: number;
}) {
  if (powerScore >= 90) return "Championship Contender";
  if (firepower >= 80) return "Firepower Heavy";
  if (winOutput >= 75) return "Clutch Win Team";
  if (consistency >= 75) return "Consistent Core";
  return "Developing Roster";
}

function getVerdict({
  teamName,
  archetype,
  powerScore,
  killRate,
  winRate,
}: {
  teamName: string;
  archetype: string;
  powerScore: number;
  killRate: string;
  winRate: number;
}) {
  if (powerScore >= 90) {
    return `${teamName} profiles as a ${archetype}. The team has elite title-contender strength, backed by ${killRate} kills per match and a ${winRate}% win rate.`;
  }

  if (powerScore >= 75) {
    return `${teamName} profiles as a ${archetype}. This is a strong tournament roster with enough output to challenge top-ranked teams.`;
  }

  if (powerScore >= 60) {
    return `${teamName} profiles as a ${archetype}. The team is competitive, but needs more consistent WWCD and kill output to climb further.`;
  }

  return `${teamName} profiles as a ${archetype}. The roster needs stronger match volume, finishing power and consistent placement output.`;
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: teamRaw } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  const team = teamRaw as TeamRow | null;

  if (!team) {
    return (
      <main className="page-shell py-10">
        <section className={card + " p-8"}>
          <h1 className="text-2xl font-black text-white">Team not found</h1>

          <Link
            href="/teams"
            className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white"
          >
            Back to teams
          </Link>
        </section>
      </main>
    );
  }

  const [
    achievementsResult,
    playersResult,
    recentMatchesResult,
    rankHistoryResult,
  ] = await Promise.all([
    supabase
      .from("team_achievements")
      .select("*")
      .eq("team_id", team.id)
      .order("year", { ascending: false }),

    supabase
      .from("players")
      .select("*")
      .eq("team_id", team.id)
      .order("ign", { ascending: true }),

    supabase
      .from("matches")
      .select(
        "*, team1:team1_id(name), team2:team2_id(name), winner:winner_team_id(name)"
      )
      .or(`team1_id.eq.${team.id},team2_id.eq.${team.id}`)
      .order("date", { ascending: false })
      .limit(5),

    supabase
      .from("ranking_history")
      .select("*")
      .eq("entity_type", "team")
      .eq("entity_id", team.id)
      .order("snapshot_date", { ascending: true }),
  ]);

  const achievements = (achievementsResult.data || []) as AchievementRow[];
  const players = (playersResult.data || []) as PlayerRow[];
  const recentMatches = (recentMatchesResult.data || []) as RecentMatchRow[];
  const rankHistory = (rankHistoryResult.data || []) as RankHistoryRow[];

  const officialRank = team.global_rank ?? null;
  const points = n(team.points);
  const wins = n(team.wins);
  const kills = n(team.kills);
  const matchesPlayed = n(team.matches_played);

  const winRate =
    matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const killRate =
    matchesPlayed > 0 ? (kills / matchesPlayed).toFixed(1) : "0.0";

  const powerScore = clamp(
    Math.round(points * 0.035 + wins * 3.5 + kills * 0.4)
  );

  const firepower = clamp(Math.round(kills * 0.4));
  const winOutput = clamp(Math.round(wins * 8));
  const rankingStrength = officialRank
    ? clamp(Math.round(100 - officialRank * 0.65))
    : 0;
  const consistency = clamp(Math.round(points * 0.04));

  const movementData = calculateMovement(rankHistory);
  const currentRank = movementData.currentRank || officialRank || 0;

  const archetype = getArchetype({
    powerScore,
    firepower,
    winOutput,
    consistency,
  });

  const recentWins = recentMatches.filter(
    (match) => match.winner_team_id === team.id
  ).length;

  const recentFormScore = Math.round(
    recentWins * 18 + recentMatches.length * 4 + wins * 0.5
  );

  const sourceLabel =
  team.source === "krafton_india_esports"
    ? "Official Krafton"
    : team.source || "PlayRank";

const sourceBadgeLabel =
  team.source === "krafton_india_esports"
    ? "Official Krafton Team"
    : team.verified
    ? "Verified Team"
    : undefined;

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-5">
            <TeamLogo name={team.name} logoUrl={team.logo_url} />

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
                Team Profile
              </p>

              <h1 className="mt-2 text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">
                {team.name}
              </h1>

              <p className="mt-2 text-white/45">
                {team.short_name || "TEAM"} · {team.country || "India"} ·{" "}
                {sourceLabel}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <DataSourceBadge
                  {...({ source: team.source, verified: team.verified, label: sourceBadgeLabel } as any)}
                />

                {team.active === false ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Inactive
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/teams/compare?team1=${team.slug}`}
              className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              Compare Team
            </Link>

            <Link
              href="/teams"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              All Teams
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Power Score" value={powerScore} />
        <Metric label="Points" value={formatValue(points)} />
        <Metric label="WWCD" value={wins} />
        <Metric label="Kills / Match" value={killRate} />
        <Metric label="Rank" value={currentRank ? `#${currentRank}` : "—"} muted />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={card + " p-6"}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Ranking History
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Rank Movement
              </h2>

              <div className="mt-3">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-white/50">
                  Ranking Snapshot
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl font-black text-[#ffd21a]">
                {movementData.movement > 0
                  ? `+${movementData.movement}`
                  : movementData.movement}
              </p>
              <p className="text-xs text-white/35">
                {movementData.direction}
              </p>
            </div>
          </div>

          {rankHistory.length > 0 ? (
            <RankHistoryChart history={rankHistory} />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
              No ranking history available yet.
            </p>
          )}
        </section>

        <section className={card + " p-6"}>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
            Team DNA
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">{archetype}</h2>

          <div className="mt-6 space-y-5">
            <Bar label="Firepower" value={firepower} />
            <Bar label="Win Output" value={winOutput} />
            <Bar label="Ranking Strength" value={rankingStrength} />
            <Bar label="Consistency" value={consistency} />
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={card + " p-6"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Active Roster
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Lineup</h2>
            </div>

            <p className="text-sm text-white/35">{players.length} players</p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {players.length > 0 ? (
              players.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{player.ign}</p>
                      <p className="mt-1 text-sm text-white/40">
                        {player.role || "Player"}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                      KD {player.kd_ratio ?? 0}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-white/30">DMG</p>
                      <p className="font-bold text-white">
                        {player.avg_damage ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/30">Kills</p>
                      <p className="font-bold text-white">
                        {player.total_kills ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-white/30">Form</p>
                      <p className="font-bold text-[#ffd21a]">
                        {player.recent_form || "N/A"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45 md:col-span-2">
                No roster data available for this team yet.
              </p>
            )}
          </div>
        </section>

        <section className={card + " p-6"}>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
            Scout Verdict
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Premium Read
          </h2>

          <div className="mt-3">
            <DataSourceBadge
              source={team.source}
              verified={team.verified}
              label={sourceBadgeLabel}
            />
          </div>

          <p className="mt-5 leading-7 text-white/62">
            {getVerdict({
              teamName: team.name,
              archetype,
              powerScore,
              killRate,
              winRate,
            })}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Metric label="Win Rate" value={`${winRate}%`} muted />
            <Metric label="Source" value={sourceLabel} muted />
          </div>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className={card + " p-6"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Recent Form
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Last 5 Matches
              </h2>
            </div>

            <div className="text-right">
              <p className="text-3xl font-black text-[#ffd21a]">
                {recentFormScore}
              </p>
              <p className="text-xs text-white/35">Form Score</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const didWin = match.winner_team_id === team.id;

                return (
                  <div
                    key={match.id}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border font-black ${
                      didWin
                        ? "border-[#ffd21a]/30 bg-[#ffd21a]/10 text-[#ffd21a]"
                        : "border-white/10 bg-white/[0.04] text-white/50"
                    }`}
                  >
                    {didWin ? "W" : "L"}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-white/40">No recent matches found.</p>
            )}
          </div>
        </section>

        <section className={card + " p-6"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Records
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Achievements
              </h2>
            </div>

            <p className="text-sm text-white/35">{achievements.length} records</p>
          </div>

          <div className="mt-6 space-y-3">
            {achievements.length > 0 ? (
              achievements.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/40">
                    {item.tournament_name || "Tournament"}
                  </p>

                  <div className="mt-4 flex justify-between text-sm">
                    <span className="font-bold text-[#ffd21a]">
                      {item.placement || "Placement"}
                    </span>
                    <span className="text-white/40">{item.year || "—"}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                No achievements added yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

