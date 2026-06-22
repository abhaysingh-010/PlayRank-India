import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TeamBase = {
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
  verified: boolean | null;
  active: boolean | null;
  source: string | null;
};

type RankingRow = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};

type MatchRow = {
  id: string;
  team1_id: string;
  team2_id: string;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
};

type TeamMatchResultRow = {
  id: string;
  team_id: string;
  placement: number | null;
  kills: number | null;
  total_points: number | null;
  created_at: string | null;
};

const surface =
  "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel =
  "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function shortNumber(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toString();
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

function getTeamBadgeLabel(team: TeamBase) {
  if (team.source === "krafton_india_esports") {
    return "Official Krafton Team";
  }

  if (team.verified) {
    return "Verified Team";
  }

  return "Team Record";
}

function TeamLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass =
    size === "xl"
      ? "h-24 w-24"
      : size === "lg"
      ? "h-16 w-16"
      : size === "sm"
      ? "h-10 w-10"
      : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.12] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-sm font-black text-white/70">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function rankTone(rank: number | null | undefined) {
  if (!rank) return "border-white/10 bg-white/[0.04] text-white/60";
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

  return "border-white/10 bg-white/[0.04] text-white/70";
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHigher(value: number, max: number) {
  if (!max || max <= 0) return 0;
  return clamp((value / max) * 100);
}

function normalizeLower(value: number, max: number) {
  if (!value || value <= 0) return 0;
  if (!max || max <= 0) return 0;
  return clamp((1 - value / max) * 100);
}

function buildRadarPoints(values: number[], radius: number, center: number) {
  const step = (Math.PI * 2) / values.length;

  return values
    .map((value, index) => {
      const angle = -Math.PI / 2 + index * step;
      const distance = (value / 100) * radius;
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;

      return `${x},${y}`;
    })
    .join(" ");
}

function buildGridPoints(sides: number, radius: number, center: number) {
  const step = (Math.PI * 2) / sides;

  return Array.from({ length: sides })
    .map((_, index) => {
      const angle = -Math.PI / 2 + index * step;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;

      return `${x},${y}`;
    })
    .join(" ");
}

function getMomentum(results: TeamMatchResultRow[] = []) {
  const matches = results.length;
  const totalPoints = results.reduce((sum, row) => sum + n(row.total_points), 0);
  const totalKills = results.reduce((sum, row) => sum + n(row.kills), 0);
  const totalPlacement = results.reduce((sum, row) => sum + n(row.placement), 0);

  const avgPoints = matches > 0 ? totalPoints / matches : 0;
  const avgKills = matches > 0 ? totalKills / matches : 0;
  const avgPlacement = matches > 0 ? totalPlacement / matches : 0;

  const score = Math.round(
    avgPoints * 2 + avgKills * 4 + Math.max(0, 16 - avgPlacement) * 3
  );

  const label =
    score >= 90
      ? "Hot Streak"
      : score >= 65
      ? "Strong Form"
      : score >= 40
      ? "Stable"
      : "Low Momentum";

  return {
    matches,
    avgPoints,
    avgKills,
    avgPlacement,
    score,
    label,
  };
}

function Mini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[1.05rem] border border-white/[0.10] bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-lg font-black ${
          highlight
            ? "bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TeamCard({
  team,
  rank,
  score,
  wins,
  kills,
  matches,
  align = "left",
}: {
  team: TeamBase;
  rank: number | null;
  score: number;
  wins: number;
  kills: number;
  matches: number;
  align?: "left" | "right";
}) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group relative block overflow-hidden rounded-[1.65rem] border border-white/[0.12] bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-transparent p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]"
    >
      <div
        className={`pointer-events-none absolute ${
          align === "right" ? "-left-16" : "-right-16"
        } -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl opacity-0 transition group-hover:opacity-100`}
      />

      <div
        className={`relative z-10 flex items-center gap-4 ${
          align === "right" ? "lg:flex-row-reverse lg:text-right" : ""
        }`}
      >
        <TeamLogo name={team.name} logoUrl={team.logo_url} size="xl" />

        <div className="min-w-0 flex-1">
          <div
            className={`flex flex-wrap items-center gap-2 ${
              align === "right" ? "lg:justify-end" : ""
            }`}
          >
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${rankTone(
                rank
              )}`}
            >
              {rank ? `#${rank}` : "Unranked"}
            </span>

            <DataSourceBadge
              source={team.source}
              verified={team.verified}
              label={getTeamBadgeLabel(team)}
            />

            {team.active === false ? (
              <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                Inactive
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 truncate text-3xl font-black tracking-tight text-white">
            {team.name}
          </h2>

          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
            {team.short_name || "TEAM"} · {team.country || "India"}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-4 gap-2">
        <Mini label="Score" value={shortNumber(score)} highlight />
        <Mini label="WWCD" value={wins} />
        <Mini label="Kills" value={kills} />
        <Mini label="Matches" value={matches} />
      </div>
    </Link>
  );
}

function MetricRow({
  label,
  left,
  right,
  lowerBetter = false,
}: {
  label: string;
  left: number;
  right: number;
  lowerBetter?: boolean;
}) {
  const leftWins = lowerBetter ? left < right : left > right;
  const rightWins = lowerBetter ? right < left : right > left;

  return (
    <div className="grid grid-cols-[1fr_150px_1fr] items-center gap-4 border-b border-white/[0.055] px-5 py-4 transition last:border-b-0 hover:bg-white/[0.025]">
      <p
        className={`text-left text-lg font-black ${
          leftWins
            ? "bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
            : "text-white/62"
        }`}
      >
        {left}
      </p>

      <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p
        className={`text-right text-lg font-black ${
          rightWins
            ? "bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
            : "text-white/62"
        }`}
      >
        {right}
      </p>
    </div>
  );
}

function RadarChart({
  firstLabel,
  secondLabel,
  firstValues,
  secondValues,
}: {
  firstLabel: string;
  secondLabel: string;
  firstValues: number[];
  secondValues: number[];
}) {
  const labels = ["Rank", "WWCD", "Kills", "Avg K", "Avg P", "Place", "Form"];
  const size = 300;
  const center = size / 2;
  const radius = 102;
  const firstPoints = buildRadarPoints(firstValues, radius, center);
  const secondPoints = buildRadarPoints(secondValues, radius, center);

  return (
    <div className={surface}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.10),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10 border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Performance Channel
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Radar Matrix
            </h2>
          </div>

          <DataSourceBadge label="Analytics Generated" />
        </div>

        <div className="mt-4 hidden items-center gap-4 text-xs md:flex">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="text-white/45">{firstLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
            <span className="text-white/45">{secondLabel}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-5 p-5 lg:grid-cols-[320px_1fr] lg:items-center">
        <div className="relative mx-auto h-[300px] w-[300px]">
          <div className="pointer-events-none absolute inset-8 rounded-full bg-emerald-300/10 blur-2xl" />

          <svg viewBox={`0 0 ${size} ${size}`} className="relative h-full w-full">
            {[0.25, 0.5, 0.75, 1].map((level) => (
              <polygon
                key={level}
                points={buildGridPoints(labels.length, radius * level, center)}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
              />
            ))}

            {labels.map((_, index) => {
              const angle = -Math.PI / 2 + index * ((Math.PI * 2) / labels.length);
              const x = center + Math.cos(angle) * radius;
              const y = center + Math.sin(angle) * radius;

              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={firstPoints}
              fill="rgba(16,185,129,0.20)"
              stroke="rgba(110,231,183,0.95)"
              strokeWidth="2.5"
            />

            <polygon
              points={secondPoints}
              fill="rgba(59,130,246,0.18)"
              stroke="rgba(147,197,253,0.95)"
              strokeWidth="2.5"
            />

            {labels.map((label, index) => {
              const angle = -Math.PI / 2 + index * ((Math.PI * 2) / labels.length);
              const labelRadius = radius + 24;
              const x = center + Math.cos(angle) * labelRadius;
              const y = center + Math.sin(angle) * labelRadius;

              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.55)"
                  fontSize="10"
                  fontWeight="700"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="grid gap-2">
          {labels.map((label, index) => {
            const left = Math.round(firstValues[index]);
            const right = Math.round(secondValues[index]);

            return (
              <div
                key={label}
                className="grid grid-cols-[80px_1fr_44px_44px] items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                  {label}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-300"
                      style={{ width: `${left}%` }}
                    />
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-300"
                      style={{ width: `${right}%` }}
                    />
                  </div>
                </div>

                <p className="text-right text-xs font-black text-emerald-300">
                  {left}
                </p>

                <p className="text-right text-xs font-black text-blue-300">
                  {right}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default async function TeamCompareDynamicPage({
  params,
}: {
  params: Promise<{ team1: string; team2: string }>;
}) {
  const { team1, team2 } = await params;

  const [firstTeamResult, secondTeamResult] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id, name, short_name, slug, country, logo_url, points, kills, wins, matches_played, global_rank, verified, active, source"
      )
      .eq("slug", team1)
      .maybeSingle(),

    supabase
      .from("teams")
      .select(
        "id, name, short_name, slug, country, logo_url, points, kills, wins, matches_played, global_rank, verified, active, source"
      )
      .eq("slug", team2)
      .maybeSingle(),
  ]);

  const firstTeam = firstTeamResult.data as TeamBase | null;
  const secondTeam = secondTeamResult.data as TeamBase | null;

  if (!firstTeam || !secondTeam) {
    notFound();
  }

  const [
    firstAnalyticsResult,
    secondAnalyticsResult,
    rankingsResult,
    h2hMatchesResult,
    firstRecentResultsResult,
    secondRecentResultsResult,
  ] = await Promise.all([
    supabase.from("team_analytics").select("*").eq("slug", team1).maybeSingle(),
    supabase.from("team_analytics").select("*").eq("slug", team2).maybeSingle(),
    supabase
      .from("rankings")
      .select("entity_id, rank, score, change")
      .eq("entity_type", "team")
      .in("entity_id", [firstTeam.id, secondTeam.id]),
    supabase
      .from("matches")
      .select("*")
      .or(
        `and(team1_id.eq.${firstTeam.id},team2_id.eq.${secondTeam.id}),and(team1_id.eq.${secondTeam.id},team2_id.eq.${firstTeam.id})`
      )
      .order("date", { ascending: false }),
    supabase
      .from("team_match_results")
      .select("*")
      .eq("team_id", firstTeam.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("team_match_results")
      .select("*")
      .eq("team_id", secondTeam.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const firstAnalytics = (firstAnalyticsResult.data || {}) as any;
  const secondAnalytics = (secondAnalyticsResult.data || {}) as any;

  const rankings = (rankingsResult.data || []) as RankingRow[];
  const rank1 = rankings.find((row) => row.entity_id === firstTeam.id);
  const rank2 = rankings.find((row) => row.entity_id === secondTeam.id);

  const h2hMatches = (h2hMatchesResult.data || []) as MatchRow[];
  const firstRecentResults = (firstRecentResultsResult.data ||
    []) as TeamMatchResultRow[];
  const secondRecentResults = (secondRecentResultsResult.data ||
    []) as TeamMatchResultRow[];

  const firstScore = n(rank1?.score, n(firstTeam.points));
  const secondScore = n(rank2?.score, n(secondTeam.points));

  const firstKills = n(firstAnalytics.total_kills, n(firstTeam.kills));
  const secondKills = n(secondAnalytics.total_kills, n(secondTeam.kills));

  const firstWins = n(firstAnalytics.wins, n(firstTeam.wins));
  const secondWins = n(secondAnalytics.wins, n(secondTeam.wins));

  const firstMatches = n(
    firstAnalytics.matches_played,
    n(firstTeam.matches_played)
  );
  const secondMatches = n(
    secondAnalytics.matches_played,
    n(secondTeam.matches_played)
  );

  const firstAvgKills =
    firstAnalytics.avg_kills !== undefined
      ? n(firstAnalytics.avg_kills)
      : firstMatches > 0
      ? firstKills / firstMatches
      : 0;

  const secondAvgKills =
    secondAnalytics.avg_kills !== undefined
      ? n(secondAnalytics.avg_kills)
      : secondMatches > 0
      ? secondKills / secondMatches
      : 0;

  const firstAvgPoints =
    firstAnalytics.avg_points !== undefined
      ? n(firstAnalytics.avg_points)
      : firstMatches > 0
      ? firstScore / firstMatches
      : 0;

  const secondAvgPoints =
    secondAnalytics.avg_points !== undefined
      ? n(secondAnalytics.avg_points)
      : secondMatches > 0
      ? secondScore / secondMatches
      : 0;

  const firstAvgPlacement = n(firstAnalytics.avg_placement, 0);
  const secondAvgPlacement = n(secondAnalytics.avg_placement, 0);

  const firstMomentum = getMomentum(firstRecentResults);
  const secondMomentum = getMomentum(secondRecentResults);

  const team1Wins = h2hMatches.filter(
    (match) => match.winner_team_id === firstTeam.id
  ).length;

  const team2Wins = h2hMatches.filter(
    (match) => match.winner_team_id === secondTeam.id
  ).length;

  const totalMeetings = h2hMatches.length;

  const closeMatches = h2hMatches.filter((match) => {
    const gap = Math.abs(n(match.team1_score) - n(match.team2_score));
    return gap <= 10;
  }).length;

  const avgScoreGap =
    totalMeetings > 0
      ? h2hMatches.reduce((sum, match) => {
          const gap = Math.abs(n(match.team1_score) - n(match.team2_score));
          return sum + gap;
        }, 0) / totalMeetings
      : 0;

  const winSplitGap = Math.abs(team1Wins - team2Wins);

  const rivalryScore = Math.round(
    totalMeetings * 18 +
      closeMatches * 22 +
      Math.max(0, 30 - avgScoreGap) +
      Math.max(0, 10 - winSplitGap) * 4
  );

  const rivalryLabel =
    rivalryScore >= 100
      ? "Elite Rivalry"
      : rivalryScore >= 70
      ? "Strong Rivalry"
      : rivalryScore >= 40
      ? "Developing Rivalry"
      : "Limited History";

  const scoreDiff = firstScore - secondScore;
  const killDiff = firstKills - secondKills;
  const winDiff = firstWins - secondWins;
  const placementDiff =
    firstAvgPlacement > 0 && secondAvgPlacement > 0
      ? secondAvgPlacement - firstAvgPlacement
      : 0;

  const edgeScore =
    scoreDiff * 0.04 + killDiff * 0.25 + winDiff * 4 + placementDiff * 8;

  const dominantTeam = edgeScore >= 0 ? firstTeam : secondTeam;
  const edgeMagnitude = Math.abs(Math.round(edgeScore));

  const firstLabel = firstTeam.short_name || firstTeam.name;
  const secondLabel = secondTeam.short_name || secondTeam.name;

  const maxScore = Math.max(firstScore, secondScore, 1);
  const maxWins = Math.max(firstWins, secondWins, 1);
  const maxKills = Math.max(firstKills, secondKills, 1);
  const maxAvgKills = Math.max(firstAvgKills, secondAvgKills, 1);
  const maxAvgPoints = Math.max(firstAvgPoints, secondAvgPoints, 1);
  const maxPlacement = Math.max(firstAvgPlacement, secondAvgPlacement, 1);
  const maxMomentum = Math.max(firstMomentum.score, secondMomentum.score, 1);

  const firstRadarValues = [
    normalizeHigher(firstScore, maxScore),
    normalizeHigher(firstWins, maxWins),
    normalizeHigher(firstKills, maxKills),
    normalizeHigher(firstAvgKills, maxAvgKills),
    normalizeHigher(firstAvgPoints, maxAvgPoints),
    normalizeLower(firstAvgPlacement, maxPlacement),
    normalizeHigher(firstMomentum.score, maxMomentum),
  ];

  const secondRadarValues = [
    normalizeHigher(secondScore, maxScore),
    normalizeHigher(secondWins, maxWins),
    normalizeHigher(secondKills, maxKills),
    normalizeHigher(secondAvgKills, maxAvgKills),
    normalizeHigher(secondAvgPoints, maxAvgPoints),
    normalizeLower(secondAvgPlacement, maxPlacement),
    normalizeHigher(secondMomentum.score, maxMomentum),
  ];

  return (
    <main className="page-shell relative space-y-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <DataSourceBadge label="Team Battle Analyzer" size="md" />
              <DataSourceBadge label="Ranking Snapshot" size="md" />
              <DataSourceBadge label="Rivalry Intelligence" size="md" />
              <DataSourceBadge label="Analytics Generated" size="md" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300/70">
              Comparative Edge
            </p>

            <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] text-white md:text-6xl">
              {firstLabel}
              <span className="mx-3 text-white/20">vs</span>
              {secondLabel}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Team comparison uses rankings, team records, analytics output,
              recent match results and head-to-head history.
            </p>
          </div>

          <Link
            href="/compare"
            className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
          >
            Change Teams
          </Link>
        </div>
      </section>

      <section className={surface}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.10),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 grid gap-0 lg:grid-cols-[1fr_240px_1fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <TeamCard
              team={firstTeam}
              rank={rank1?.rank ?? firstTeam.global_rank}
              score={firstScore}
              wins={firstWins}
              kills={firstKills}
              matches={firstMatches}
            />
          </div>

          <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-b from-emerald-400/[0.075] via-white/[0.025] to-transparent p-5 text-center lg:border-b-0">
            <div className="pointer-events-none absolute h-44 w-44 rounded-full border border-emerald-300/15" />
            <div className="pointer-events-none absolute h-32 w-32 rounded-full border border-emerald-300/20" />

            <DataSourceBadge label="Analytics Generated" />

            <p className="relative z-10 mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Comparative Edge
            </p>

            <div className="relative z-10 mt-4 flex h-28 w-28 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 shadow-[0_0_45px_rgba(16,185,129,0.20)]">
              <div>
                <p className="text-4xl font-black tracking-[-0.08em] text-emerald-300">
                  +{edgeMagnitude}
                </p>

                <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">
                  Edge
                </p>
              </div>
            </div>

            <h2 className="relative z-10 mt-4 text-2xl font-black text-white">
              {dominantTeam.short_name || dominantTeam.name}
            </h2>

            <p className="relative z-10 mt-2 text-xs leading-5 text-white/42">
              Current overall edge based on weighted team signals.
            </p>
          </div>

          <div className="p-5 lg:border-l">
            <TeamCard
              team={secondTeam}
              rank={rank2?.rank ?? secondTeam.global_rank}
              score={secondScore}
              wins={secondWins}
              kills={secondKills}
              matches={secondMatches}
              align="right"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <RadarChart
          firstLabel={firstLabel}
          secondLabel={secondLabel}
          firstValues={firstRadarValues}
          secondValues={secondRadarValues}
        />

        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.10),transparent_34%)]" />

          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
                  Combat Matrix
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
                  Core Metrics
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Ranking Snapshot" />
                <DataSourceBadge label="Analytics Generated" />
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-[1fr_150px_1fr] border-b border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white/35">
            <p>{firstLabel}</p>
            <p className="text-center">Metric</p>
            <p className="text-right">{secondLabel}</p>
          </div>

          <div className="relative z-10">
            <MetricRow label="Ranking Score" left={firstScore} right={secondScore} />
            <MetricRow label="WWCD" left={firstWins} right={secondWins} />
            <MetricRow label="Total Kills" left={firstKills} right={secondKills} />
            <MetricRow
              label="Avg Kills"
              left={Number(firstAvgKills.toFixed(1))}
              right={Number(secondAvgKills.toFixed(1))}
            />
            <MetricRow
              label="Avg Points"
              left={Number(firstAvgPoints.toFixed(1))}
              right={Number(secondAvgPoints.toFixed(1))}
            />
            <MetricRow
              label="Avg Placement"
              left={Number(firstAvgPlacement.toFixed(1))}
              right={Number(secondAvgPlacement.toFixed(1))}
              lowerBetter
            />
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className={`${panel} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              H2H
            </p>

            <DataSourceBadge label="Match Data" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-white">{team1Wins}</p>
              <p className="text-xs text-white/40">{firstLabel}</p>
            </div>

            <div className="text-center">
              <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-black text-white/55">
                {totalMeetings}
              </p>

              <p className="mt-1 text-xs text-white/35">Meetings</p>
            </div>

            <div className="text-right">
              <p className="text-4xl font-black text-white">{team2Wins}</p>
              <p className="text-xs text-white/40">{secondLabel}</p>
            </div>
          </div>
        </div>

        <div className={`${panel} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Momentum
            </p>

            <DataSourceBadge label="Recent Form" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-4xl font-black text-emerald-300">
                {firstMomentum.score}
              </p>
              <p className="text-xs text-white/40">{firstMomentum.label}</p>
            </div>

            <div className="text-right">
              <p className="text-4xl font-black text-emerald-300">
                {secondMomentum.score}
              </p>
              <p className="text-xs text-white/40">{secondMomentum.label}</p>
            </div>
          </div>
        </div>

        <div className={`${panel} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Rivalry
            </p>

            <DataSourceBadge label="Rivalry Intelligence" />
          </div>

          <p className="mt-4 text-4xl font-black text-white">{rivalryScore}</p>

          <p className="mt-1 text-xs text-white/40">
            {rivalryLabel} · {closeMatches} close
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-300/25 bg-gradient-to-br from-emerald-400/[0.16] via-emerald-400/[0.07] to-white/[0.03] p-5 shadow-[0_0_45px_rgba(16,185,129,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/70">
                Final Read
              </p>

              <DataSourceBadge label="Analytics Generated" />
            </div>

            <p className="mt-4 text-2xl font-black text-white">
              {dominantTeam.name}
            </p>

            <p className="mt-1 text-sm font-black text-emerald-300">
              Overall Edge + {edgeMagnitude}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}