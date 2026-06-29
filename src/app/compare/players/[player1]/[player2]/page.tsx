import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TeamMini = 
{
  id: string;
  name: string;
  slug: string;
  short_name?: string | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

type PlayerRow = 
{
  id: string;
  ign: string;
  slug: string;
  real_name?: string | null;
  role?: string | null;
  country?: string | null;
  team_id?: string | null;
  matches_played?: number | null;
  total_kills?: number | null;
  avg_kills?: number | null;
  avg_damage?: number | null;
  kd_ratio?: number | null;
  win_rate?: number | null;
  mvp_count?: number | null;
  assists?: number | null;
  revives?: number | null;
  knocks?: number | null;
  recent_form?: string | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
  team?: TeamMini | null;
};

type PlayerRaw = Omit<PlayerRow, "team"> & 
{
  team?: TeamMini | TeamMini[] | null;
};

type RankingRow = 
{
  entity_id: string;
  rank: number | null;
  score: number | null;
  change: number | null;
  updated_at: string | null;
};

type PlayerMatchStat = 
{
  id: string | number;
  player_id: string;
  match_id?: string | null;
  kills?: number | null;
  damage?: number | null;
  assists?: number | null;
  revives?: number | null;
  knocks?: number | null;
  survival_time?: number | null;
  mvp?: boolean | null;
  is_mvp?: boolean | null;
  created_at?: string | null;
};

const surface = "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel = "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function one<T>(value: T | T[] | null | undefined): T | null 
{
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp(value: number, min = 0, max = 100) 
{
  return Math.max(min, Math.min(max, value));
}

function formatDate(value: string | null | undefined) 
{
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

function getLatestDate(values: Array<string | null | undefined>) 
{
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;

  return new Date(Math.max(...timestamps)).toISOString();
}

function getInitials(name: string) 
{
  return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join("")
  .toUpperCase();
}

function normalizeHigher(value: number, max: number) 
{
  if (!max || max <= 0) return 0;
  return clamp((value / max) * 100);
}

function buildRadarPoints(values: number[], radius: number, center: number) 
{
  const step = (Math.PI * 2) / values.length;

  return values
  .map
  (
    (value, index) => 
    {
      const angle = -Math.PI / 2 + index * step;
      const distance = (value / 100) * radius;
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;

      return `${x},${y}`;
    }
  )
  .join(" ");
}

function buildGridPoints(sides: number, radius: number, center: number) 
{
  const step = (Math.PI * 2) / sides;

  return Array.from({ length: sides })
    .map((_, index) => 
    {
      const angle = -Math.PI / 2 + index * step;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;

      return `${x},${y}`;
    })
    .join(" ");
}

function rankTone(rank: number | null | undefined) 
{
  if (!rank) return "border-white/10 bg-white/[0.04] text-white/60";
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-blue-400/25 bg-blue-400/10 text-blue-300";

  return "border-white/10 bg-white/[0.04] text-white/70";
}

function getPlayerBadgeLabel(player?: PlayerRow | null) 
{
  if (!player) return "Player Record";
  if (player.source === "krafton_india_esports") return "Official Krafton Player";
  if (player.verified) return "Verified Player";
  return "Player Record";
}

function getTeamBadgeLabel(team?: TeamMini | null) 
{
  if (!team) return "Team Record";
  if (team.source === "krafton_india_esports") return "Official Krafton Team";
  if (team.verified) return "Verified Team";
  return "Team Record";
}

function getConfidence(sampleSize: number) 
{
  if (sampleSize >= 10) 
  {
    return {
      label: "High Confidence",
      tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      note: "Strong enough sample for a more reliable duel read.",
    };
  }

  if (sampleSize >= 3) 
  {
    return {
      label: "Medium Confidence",
      tone: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
      note: "Useful signal, but still based on a partial sample.",
    };
  }

  return {
    label: "Low Confidence",
    tone: "border-red-400/30 bg-red-400/10 text-red-300",
    note: "Limited sample. Treat this comparison as directional, not final.",
  };
}

function PlayerAvatar
(
  {
    ign,
    role,
    size = "xl",
  }
  : 
  {
    ign: string;
    role?: string | null;
    size?: "sm" | "md" | "lg" | "xl";
  }
) 
{
  const sizeClass = size === "xl"? "h-24 w-24" : size === "lg"? "h-16 w-16" : size === "sm"? "h-10 w-10": "h-12 w-12";

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-blue-400/[0.18] via-white/[0.05] to-[#ffd21a]/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
      <div className="text-center">
        <p className="text-xl font-black text-white">{getInitials(ign)}</p>
        {size !== "sm" ? 
          (
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">{role || "Player"}</p>
          ) : null
        }
      </div>
    </div>
  );
}

function getPlayerMomentum(stats: PlayerMatchStat[] = []) 
{
  const matches = stats.length;
  const totalKills = stats.reduce((sum, stat) => sum + n(stat.kills), 0);
  const totalDamage = stats.reduce((sum, stat) => sum + n(stat.damage), 0);
  const totalAssists = stats.reduce((sum, stat) => sum + n(stat.assists), 0);
  const totalKnocks = stats.reduce((sum, stat) => sum + n(stat.knocks), 0);
  const mvpCount = stats.filter((stat) => stat.mvp === true || stat.is_mvp === true).length;
  const avgKills = matches > 0 ? totalKills / matches : 0;
  const avgDamage = matches > 0 ? totalDamage / matches : 0;
  const avgAssists = matches > 0 ? totalAssists / matches : 0;
  const avgKnocks = matches > 0 ? totalKnocks / matches : 0;

  const score = Math.round
  (
    avgKills * 18 +
    avgDamage / 12 +
    avgAssists * 7 +
    avgKnocks * 8 +
    mvpCount * 10
  );

  const label = score >= 90 ? "Peak Form" : score >= 65  ? "Strong Form": score >= 40  ? "Stable"  : "Low Momentum";
  return {matches, avgKills, avgDamage, avgAssists, avgKnocks, mvpCount, score, label,};
}

function Mini
(
  {
    label,
    value,
    highlight = false,
  }
  : 
  {
    label: string;
    value: string | number;
    highlight?: boolean;
  }
) 
{
  return (
    <div className="rounded-[1.05rem] border border-white/[0.10] bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className={`mt-1 truncate text-lg font-black ${highlight ? "text-[#ffd21a]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function PlayerCard
(
  {
    player,
    rank,
    score,
    kills,
    damage,
    mvp,
    align = "left",
  }
  : 
  {
    player: PlayerRow;
    rank: number | null;
    score: number;
    kills: number;
    damage: number;
    mvp: number;
    align?: "left" | "right";
  }
) 
{
  function shortNumber(score: number): string | number 
  {
    throw new Error("Function not implemented.");
  }

  return (
    <Link href={`/players/${player.slug}`}className="group relative block overflow-hidden rounded-[1.65rem] border border-white/[0.12] bg-gradient-to-br from-white/[0.075] via-white/[0.035] to-transparent p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.07]">
      <div className={`pointer-events-none absolute ${align === "right" ? "-left-16" : "-right-16"} -top-16 h-40 w-40 rounded-full bg-[#ffd21a]/10 blur-3xl opacity-0 transition group-hover:opacity-100`}/>
      <div className={`relative z-10 flex items-center gap-4 ${align === "right" ? "lg:flex-row-reverse lg:text-right" : ""}`}>
        <PlayerAvatar ign={player.ign} role={player.role} size="xl" />
        <div className="min-w-0 flex-1">
          <div className={`flex flex-wrap items-center gap-2 ${align === "right" ? "lg:justify-end" : ""}`}>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${rankTone(rank)}`}>{rank ? `#${rank}` : "Unranked"}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white/55">{player.role || "Player"}</span>
            <DataSourceBadge source={player.source} verified={player.verified} label={getPlayerBadgeLabel(player)}/>
            {player.active === false ? 
              (
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">Inactive</span>
              ) : null
            }
          </div>
          <h2 className="mt-3 truncate text-3xl font-black tracking-tight text-white">{player.ign}</h2>
          <p className="mt-1 truncate text-xs uppercase tracking-[0.22em] text-white/35">{player.real_name || player.team?.name || "Player Profile"}</p>
          <div className={`mt-3 flex flex-wrap gap-2 ${align === "right" ? "lg:justify-end" : ""}`}>
            <DataSourceBadge source={player.team?.source} verified={player.team?.verified}label={getTeamBadgeLabel(player.team)}/>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-5 grid grid-cols-4 gap-2">
        <Mini label="Score" value={shortNumber(score)} highlight />
        <Mini label="Kills" value={kills} />
        <Mini label="Damage" value={Math.round(damage)} />
        <Mini label="MVP" value={mvp} />
      </div>
    </Link>
  );
}

function MetricRow
(
  {
    label,
    left,
    right,
    decimals = 0,
    suffix = "",
  }
  : 
  {
    label: string;
    left: number;
    right: number;
    decimals?: number;
    suffix?: string;
  }
) 
{
  const leftWins = left > right;
  const rightWins = right > left;

  return (
    <div className="grid grid-cols-[1fr_150px_1fr] items-center gap-4 border-b border-white/[0.055] px-5 py-4 transition last:border-b-0 hover:bg-white/[0.025]">
      <p className={`text-left text-lg font-black ${leftWins ? "text-[#ffd21a]" : "text-white/62"}`}>{left.toFixed(decimals)}{suffix}</p>
      <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className={`text-right text-lg font-black ${rightWins ? "text-[#ffd21a]" : "text-white/62"}`}>{right.toFixed(decimals)}{suffix}</p>
    </div>
  );
}

function RadarChart
(
  {
    firstLabel,
    secondLabel,
    firstValues,
    secondValues,
  }
  : 
  {
    firstLabel: string;
    secondLabel: string;
    firstValues: number[];
    secondValues: number[];
  }
) 
{
  const labels = ["Score", "Kills", "Damage", "KD", "Win", "MVP", "Form"];
  const size = 300;
  const center = size / 2;
  const radius = 102;
  const firstPoints = buildRadarPoints(firstValues, radius, center);
  const secondPoints = buildRadarPoints(secondValues, radius, center);

  return (
    <section className={surface}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.12),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.10),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10 border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">Performance Channel</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Radar Matrix</h2>
          </div>
          <DataSourceBadge label="Analytics Generated" />
        </div>
        <div className="mt-4 hidden items-center gap-4 text-xs md:flex">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffd21a]" />
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
          <div className="pointer-events-none absolute inset-8 rounded-full bg-[#ffd21a]/10 blur-2xl" />
          <svg viewBox={`0 0 ${size} ${size}`} className="relative h-full w-full">
            {[0.25, 0.5, 0.75, 1].map
              ((level) => 
                (
                  <polygon key={level}points={buildGridPoints(labels.length, radius * level, center)}fill="none"stroke="rgba(255,255,255,0.10)"strokeWidth="1"/>
                )
              )
            }
            {labels.map
              ((_, index) => 
                {
                  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / labels.length);
                  const x = center + Math.cos(angle) * radius;
                  const y = center + Math.sin(angle) * radius;

                  return (
                    <line key={index}x1={center}y1={center}x2={x}y2={y}stroke="rgba(255,255,255,0.08)"strokeWidth="1"/>
                  );
                }
              )
            }
            <polygon points={firstPoints} fill="rgba(250,204,21,0.20)" stroke="rgba(250,204,21,0.95)"strokeWidth="2.5"/>
            <polygon points={secondPoints} fill="rgba(59,130,246,0.18)" stroke="rgba(147,197,253,0.95)" strokeWidth="2.5"/>
            {labels.map
              ((label, index) => 
                {
                  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / labels.length);
                  const labelRadius = radius + 24;
                  const x = center + Math.cos(angle) * labelRadius;
                  const y = center + Math.sin(angle) * labelRadius;

                  return (
                    <text key={label}x={x}y={y}textAnchor="middle"dominantBaseline="middle"fill="rgba(255,255,255,0.55)"fontSize="10"fontWeight="700">
                      {label}
                    </text>
                  );
                }
              )
            }
          </svg>
        </div>

        <div className="grid gap-2">
          {labels.map
            ((label, index) => 
              {
                const left = Math.round(firstValues[index]);
                const right = Math.round(secondValues[index]);

                return (
                  <div key={label}className="grid grid-cols-[80px_1fr_44px_44px] items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">{label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#ffd21a]"style={{ width: `${left}%` }}/>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-300"style={{ width: `${right}%` }}/>
                      </div>
                    </div>
                    <p className="text-right text-xs font-black text-[#ffd21a]">{left}</p>
                    <p className="text-right text-xs font-black text-blue-300">{right}</p>
                  </div>
                );
              }
            )
          }
        </div>
      </div>
    </section>
  );
}

function InsightCard
(
  {
    label,
    value,
    description,
    badge,
    accent = false,
  }
  : 
  {
    label: string;
    value: string | number;
    description: string;
    badge: string;
    accent?: boolean;
  }
) 
{
  return (
    <article className={accent? "relative overflow-hidden rounded-[1.35rem] border border-[#ffd21a]/25 bg-gradient-to-br from-[#ffd21a]/[0.16] via-[#ffd21a]/[0.07] to-white/[0.03] p-5 shadow-[0_0_45px_rgba(250,204,21,0.14),inset_0_1px_0_rgba(255,255,255,0.08)]": `${panel} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">{label}</p>
        <DataSourceBadge label={badge} />
      </div>
      <p className={`mt-4 text-4xl font-black ${accent ? "text-[#ffd21a]" : "text-white"}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
    </article>
  );
}

export default async function PlayerCompareDynamicPage
(
  {
    params,
  } 
  : 
  {
    params: Promise<{ player1: string; player2: string }>;
  }
) 
{
  const { player1, player2 } = await params;

  const [firstPlayerResult, secondPlayerResult] = await Promise.all
  (
    [
      supabase
      .from("players")
      .select
      (
        `
          *,
          team:team_id 
          (
            id,
            name,
            slug,
            short_name,
            source,
            verified,
            active
          )
        `
      )
      .eq("slug", player1)
      .maybeSingle(),

      supabase
      .from("players")
      .select
      (
        `
          *,
          team:team_id
          (
            id,
            name,
            slug,
            short_name,
            source,
            verified,
            active
          )
        `
      )
      .eq("slug", player2)
      .maybeSingle(),
    ]
  );

  const firstPlayerRaw = firstPlayerResult.data as PlayerRaw | null;
  const secondPlayerRaw = secondPlayerResult.data as PlayerRaw | null;

  if (!firstPlayerRaw || !secondPlayerRaw) 
  {
    notFound();
  }

  const firstPlayer: PlayerRow = 
  {
    ...firstPlayerRaw,
    team: one(firstPlayerRaw.team),
  };

  const secondPlayer: PlayerRow = 
  {
    ...secondPlayerRaw,
    team: one(secondPlayerRaw.team),
  };

  const [rankingsResult, firstRecentStatsResult, secondRecentStatsResult] =
  await Promise.all
  (
    [
      supabase
      .from("rankings")
      .select("entity_id, rank, score, change, updated_at")
      .eq("entity_type", "player")
      .in("entity_id", [firstPlayer.id, secondPlayer.id]),

      supabase
      .from("player_match_stats")
      .select("*")
      .eq("player_id", firstPlayer.id)
      .limit(20),

      supabase
      .from("player_match_stats")
      .select("*")
      .eq("player_id", secondPlayer.id)
      .limit(20),
    ]
  );

  const rankings = (rankingsResult.data || []) as RankingRow[];
  const rank1 = rankings.find((row) => row.entity_id === firstPlayer.id);
  const rank2 = rankings.find((row) => row.entity_id === secondPlayer.id);
  const firstRecentStats = (firstRecentStatsResult.data || []) as PlayerMatchStat[];
  const secondRecentStats = (secondRecentStatsResult.data || []) as PlayerMatchStat[];
  const firstKills = n(firstPlayer.total_kills);
  const secondKills = n(secondPlayer.total_kills);
  const firstDamage = n(firstPlayer.avg_damage);
  const secondDamage = n(secondPlayer.avg_damage);
  const firstKd = n(firstPlayer.kd_ratio);
  const secondKd = n(secondPlayer.kd_ratio);
  const firstWinRate = n(firstPlayer.win_rate);
  const secondWinRate = n(secondPlayer.win_rate);
  const firstMvp = n(firstPlayer.mvp_count);
  const secondMvp = n(secondPlayer.mvp_count);
  const firstMatches = n(firstPlayer.matches_played);
  const secondMatches = n(secondPlayer.matches_played);
  const firstAvgKills = firstPlayer.avg_kills !== undefined && firstPlayer.avg_kills !== null ? n(firstPlayer.avg_kills) : firstMatches > 0? firstKills / firstMatches : 0;
  const secondAvgKills = secondPlayer.avg_kills !== undefined && secondPlayer.avg_kills !== null? n(secondPlayer.avg_kills) : secondMatches > 0? secondKills / secondMatches : 0;
  const firstMomentum = getPlayerMomentum(firstRecentStats);
  const secondMomentum = getPlayerMomentum(secondRecentStats);
  const firstScore = rank1?.score ??Math.round(firstKills * 1.4 + firstDamage * 0.35 + firstKd * 100 + firstMvp * 30);
  const secondScore = rank2?.score ??Math.round(secondKills * 1.4 + secondDamage * 0.35 + secondKd * 100 + secondMvp * 30);
  const scoreDiff = firstScore - secondScore;
  const killDiff = firstKills - secondKills;
  const damageDiff = firstDamage - secondDamage;
  const kdDiff = firstKd - secondKd;
  const mvpDiff = firstMvp - secondMvp;
  const momentumDiff = firstMomentum.score - secondMomentum.score;
  const edgeScore = scoreDiff * 0.035 + killDiff * 0.18 + damageDiff * 0.08 + kdDiff * 18 + mvpDiff * 6 + momentumDiff * 0.35;
  const dominantPlayer = edgeScore >= 0 ? firstPlayer : secondPlayer;
  const edgeMagnitude = Math.abs(Math.round(edgeScore));
  const sampleSize = firstRecentStats.length + secondRecentStats.length + firstMatches + secondMatches;
  const confidence = getConfidence(sampleSize);
  const latestCompareUpdate = getLatestDate
  (
    [
      rank1?.updated_at,
      rank2?.updated_at,
      ...firstRecentStats.map((row) => row.created_at),
      ...secondRecentStats.map((row) => row.created_at),
    ]
  );
  const maxScore = Math.max(firstScore, secondScore, 1);
  const maxKills = Math.max(firstKills, secondKills, 1);
  const maxDamage = Math.max(firstDamage, secondDamage, 1);
  const maxKd = Math.max(firstKd, secondKd, 1);
  const maxWinRate = Math.max(firstWinRate, secondWinRate, 1);
  const maxMvp = Math.max(firstMvp, secondMvp, 1);
  const maxMomentum = Math.max(firstMomentum.score, secondMomentum.score, 1);
  const firstRadarValues = 
  [
    normalizeHigher(firstScore, maxScore),
    normalizeHigher(firstKills, maxKills),
    normalizeHigher(firstDamage, maxDamage),
    normalizeHigher(firstKd, maxKd),
    normalizeHigher(firstWinRate, maxWinRate),
    normalizeHigher(firstMvp, maxMvp),
    normalizeHigher(firstMomentum.score, maxMomentum),
  ];

  const secondRadarValues = 
  [
    normalizeHigher(secondScore, maxScore),
    normalizeHigher(secondKills, maxKills),
    normalizeHigher(secondDamage, maxDamage),
    normalizeHigher(secondKd, maxKd),
    normalizeHigher(secondWinRate, maxWinRate),
    normalizeHigher(secondMvp, maxMvp),
    normalizeHigher(secondMomentum.score, maxMomentum),
  ];

  return (
    <main className="page-shell relative space-y-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <DataSourceBadge label="Player Duel Analyzer" size="md" />
              <DataSourceBadge label="Ranking Snapshot" size="md" />
              <DataSourceBadge label="Duel Intelligence" size="md" />
              <DataSourceBadge label="Analytics Generated" size="md" />
              <DataSourceBadge label={confidence.label} size="md" />
              <DataSourceBadge label={`Last Updated: ${formatDate(latestCompareUpdate)}`} size="md" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">Player Duel Analyzer</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] text-white md:text-6xl">
              {firstPlayer.ign}
              <span className="mx-3 text-white/20">vs</span>
              {secondPlayer.ign}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Player comparison uses player records, ranking snapshots, team
              context, match-stat samples and PlayRank analytics. {confidence.note}
              PlayRank duel reads are independent intelligence signals, not official
              predictions or outcome guarantees.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/players/compare"className="w-fit rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15">
              Change Players
            </Link>
            <Link href="/data"className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
              Data Trust
            </Link>
          </div>
        </div>
      </section>
      <section className={surface}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(250,204,21,0.12),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.10),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 grid gap-0 lg:grid-cols-[1fr_240px_1fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:border-white/10">
            <PlayerCard player={firstPlayer}rank={rank1?.rank ?? null}score={firstScore}kills={firstKills}damage={firstDamage}mvp={firstMvp}/>
          </div>
          <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#ffd21a]/[0.075] via-white/[0.025] to-transparent p-5 text-center lg:border-b-0">
            <div className="pointer-events-none absolute h-44 w-44 rounded-full border border-[#ffd21a]/15" />
            <div className="pointer-events-none absolute h-32 w-32 rounded-full border border-[#ffd21a]/20" />
            <DataSourceBadge label="Analytics Generated" />
            <p className="relative z-10 mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/35">Comparative Edge</p>
            <div className="relative z-10 mt-4 flex h-28 w-28 items-center justify-center rounded-full border border-[#ffd21a]/25 bg-[#ffd21a]/10 shadow-[0_0_45px_rgba(250,204,21,0.18)]">
              <div>
                <p className="text-4xl font-black tracking-[-0.08em] text-[#ffd21a]">{edgeMagnitude === 0 ? "EVEN" : `+${edgeMagnitude}`}</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Edge</p>
              </div>
            </div>
            <h2 className="relative z-10 mt-4 text-2xl font-black text-white">{dominantPlayer.ign}</h2>
            <p className="relative z-10 mt-2 text-xs leading-5 text-white/42">Current player edge based on weighted performance signals.</p>
          </div>
          <div className="p-5 lg:border-l lg:border-white/10">
            <PlayerCard player={secondPlayer} rank={rank2?.rank ?? null} score={secondScore} kills={secondKills} damage={secondDamage} mvp={secondMvp} align="right"/>
          </div>
        </div>
      </section>
      <section className={`${panel} p-5`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Sample Size" />
              <DataSourceBadge label="Confidence Layer" />
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">Data Confidence</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">{confidence.note}</p>
          </div>
          <div className={`rounded-2xl border px-5 py-4 text-right ${confidence.tone}`}>
            <p className="text-sm font-black uppercase tracking-[0.18em]">{confidence.label}</p>
            <p className="mt-1 text-xs opacity-80">Sample size: {sampleSize}</p>
          </div>
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <RadarChart firstLabel={firstPlayer.ign}secondLabel={secondPlayer.ign}firstValues={firstRadarValues}secondValues={secondRadarValues}/>
        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(250,204,21,0.10),transparent_34%)]" />
          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">Combat Matrix</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Core Metrics</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Ranking Snapshot" />
                <DataSourceBadge label="Analytics Generated" />
              </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-[1fr_150px_1fr] border-b border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white/35">
            <p>{firstPlayer.ign}</p>
            <p className="text-center">Metric</p>
            <p className="text-right">{secondPlayer.ign}</p>
          </div>
          <div className="relative z-10">
            <MetricRow label="Ranking Score" left={firstScore} right={secondScore} />
            <MetricRow label="Total Kills" left={firstKills} right={secondKills} />
            <MetricRow label="Avg Damage" left={firstDamage} right={secondDamage} />
            <MetricRow label="KD Ratio" left={firstKd} right={secondKd} decimals={2} />
            <MetricRow label="Win Rate" left={firstWinRate} right={secondWinRate} decimals={1} suffix="%" />
            <MetricRow label="MVP Count" left={firstMvp} right={secondMvp} />
            <MetricRow label="Avg Kills" left={firstAvgKills} right={secondAvgKills} decimals={1} />
          </div>
        </section>
      </section>
      <section className="grid gap-4 lg:grid-cols-4">
        <InsightCard label="Team Context"value={`${firstPlayer.team?.short_name || firstPlayer.team?.name || "—"} / ${secondPlayer.team?.short_name || secondPlayer.team?.name || "—"}`}description="Team affiliation gives role and system context to the duel."badge="Team Source"/>
        <InsightCard label="Momentum"value={`${firstMomentum.score}-${secondMomentum.score}`}description={`${firstPlayer.ign}: ${firstMomentum.label}. ${secondPlayer.ign}: ${secondMomentum.label}.`}badge="Recent Form"/>
        <InsightCard label="Sample" value={`${firstRecentStats.length}-${secondRecentStats.length}`}description="Recent match-stat records currently available for each player."badge="Match Stats"/>
        <InsightCard label="Final Read"value={dominantPlayer.ign}description={`Overall edge +${edgeMagnitude} from score, kills, damage, KD, MVP and recent form.`}badge="Analytics Generated"accent/>
      </section>
    </main>
  );
}