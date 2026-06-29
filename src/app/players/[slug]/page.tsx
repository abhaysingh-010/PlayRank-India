import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RankHistoryChart from "@/components/RankHistoryChart";
import DataSourceBadge from "@/components/DataSourceBadge";

type PlayerTeamRow = 
{
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  global_rank: number | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

type PlayerRow = 
{
  id: string;
  ign: string;
  real_name: string | null;
  slug: string;
  team_id: string | null;
  role: string | null;
  country: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  recent_form: string | number | null;
  assists?: number | null;
  revives?: number | null;
  knocks?: number | null;
  source?: string | null;
  source_url?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
  team: PlayerTeamRow | null;
};

type PlayerQueryRow = Omit<PlayerRow, "team"> & 
{
  team: PlayerTeamRow | PlayerTeamRow[] | null;
};

type PlayerMatchStat = 
{
  id: string | number;
  match_id: string | null;
  kills: number | null;
  damage: number | null;
  placement: number | null;
  assists: number | null;
  revives: number | null;
  knocks: number | null;
  is_mvp: boolean | null;
  mvp: boolean | null;
};

type RankingHistoryRow = 
{
  id: string;
  entity_type: string;
  entity_id: string;
  rank: number;
  score: number;
  snapshot_date: string;
  created_at?: string | null;
};

type RankingRow = 
{
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

const card = "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard = "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
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

function clamp(value: number, min = 0, max = 100) 
{
  return Math.max(min, Math.min(max, value));
}

function formatValue(value: unknown, decimals = 0) 
{
  const safe = n(value);
  return decimals > 0 ? safe.toFixed(decimals) : Math.round(safe).toString();
}

function formatDate(value: string | null | undefined) 
{
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString
  ("en-IN", 
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
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

function formatChange(value: number | null | undefined) 
{
  if (!value) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

function changeTone(value: number | null | undefined) 
{
  if (!value) return "text-white/35";
  if (value > 0) return "text-emerald-300";
  return "text-red-300";
}

function getSourceLabel(source: string | null | undefined) 
{
  if (source === "krafton_india_esports") return "Official Krafton";
  if (source === "pubg_api") return "PUBG API";
  if (source === "admin_manual") return "Admin Verified";
  return source || "PlayRank";
}

function getPlayerConfidence(totalMatches: number) {
  if (totalMatches >= 20) 
  {
    return {
      label: "High Confidence",
      description: "This profile has enough match data for stronger directional analysis.",
    };
  }

  if (totalMatches >= 5) 
  {
    return {
      label: "Medium Confidence",
      description: "This profile has usable match data, but the sample size is still developing.",
    };
  }

  return {
    label: "Low Confidence",
    description: "This profile has limited match data. Treat analytics as early directional signals.",
  };
}

function PlayerAvatar({ ign, role }: { ign: string; role?: string | null }) 
{
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="text-center">
        <span className="block text-2xl font-black tracking-tight text-white">{getInitials(ign)}</span>
        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">{role || "Player"}</span>
      </div>
    </div>
  );
}

function Metric
(
  {
    label,
    value,
    muted = false,
  }
  : 
  {
    label: string;
    value: string | number;
    muted?: boolean;
  }
) 
{
    return (
      <div className={softCard + " p-4"}>
        <p className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</p>
        <p className={`mt-2 text-2xl font-black ${muted ? "text-white/65" : "text-white"}`}>{value}</p>
      </div>
    );
  }

function Bar
(
  { 
    label, 
    value 
  }
  : 
  { 
    label: string; 
    value: number 
  }
) 
{
  const safeValue = clamp(value);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className="font-bold text-white/80">{safeValue}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#ffd21a]"style={{ width: `${safeValue}%` }}/>
      </div>
    </div>
  );
}

function ActiveBadge
(
  { 
    active 
  }
  : 
  { 
    active?: boolean | null 
  }
) 
{
  if (active === false) 
  {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />Inactive</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />Active</span>
  );
}

export default async function PlayerPage
(
  {
    params,
  }
  : 
  {
    params: Promise<{ slug: string }>;
  }
) 
{
  const { slug } = await params;
  const { data: playerRaw, error: playerError } = await supabase
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
        global_rank,
        source,
        verified,
        active
      )
    `
  )
  .eq("slug", slug)
  .single();

  if (playerError || !playerRaw) 
  {
    return (
      <main className="page-shell py-10">
        <section className={card + " p-8"}>
          <h1 className="text-2xl font-bold text-white">Player not found</h1>
          <p className="mt-3 text-white/45">This player profile does not exist or is not available yet.</p>
          <Link href="/players"className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">Back to players</Link>
        </section>
      </main>
    );
  }
  const playerQuery = playerRaw as PlayerQueryRow;
  const player: PlayerRow = {...playerQuery, team: Array.isArray(playerQuery.team)? playerQuery.team[0] || null : playerQuery.team,};
  const 
  [
    rankingResult,
    statsResult,
    recentMatchesResult,
    rankHistoryResult,
  ] 
  = await Promise.all
  (
    [
      supabase
      .from("rankings")
      .select("rank, score, change, updated_at")
      .eq("entity_type", "player")
      .eq("entity_id", player.id)
      .maybeSingle(),

      supabase
      .from("player_match_stats")
      .select("id, match_id, kills, damage, placement, assists, revives, knocks, is_mvp, mvp")
      .eq("player_id", player.id),

      supabase
      .from("player_match_stats")
      .select("id, match_id, kills, damage, placement, assists, revives, knocks, is_mvp, mvp")
      .eq("player_id", player.id)
      .order("id", { ascending: false })
      .limit(5),

      supabase
      .from("ranking_history")
      .select("*")
      .eq("entity_type", "player")
      .eq("entity_id", player.id)
      .order("snapshot_date", { ascending: true }),
    ]
  );
  const currentRanking = rankingResult.data as RankingRow | null;
  const stats = (statsResult.data || []) as PlayerMatchStat[];
  const recentMatches = (recentMatchesResult.data || []) as PlayerMatchStat[];
  const rankHistory = (rankHistoryResult.data || []) as RankingHistoryRow[];
  const totalMatches = stats.length || n(player.matches_played);
  const totalKills = stats.reduce((sum, match) => sum + n(match.kills), 0) || n(player.total_kills);
  const totalDamage = stats.reduce((sum, match) => sum + n(match.damage), 0) || n(player.avg_damage) * totalMatches;
  const totalAssists = stats.reduce((sum, match) => sum + n(match.assists), 0) || n(player.assists);
  const totalRevives = stats.reduce((sum, match) => sum + n(match.revives), 0) || n(player.revives);
  const totalKnocks = stats.reduce((sum, match) => sum + n(match.knocks), 0) || n(player.knocks);
  const mvpCount = stats.filter((match) => match.is_mvp === true || match.mvp === true).length || n(player.mvp_count);
  const avgKills = totalMatches > 0 ? totalKills / totalMatches : 0;
  const avgDamage = totalMatches > 0 ? totalDamage / totalMatches : n(player.avg_damage);
  const aggression = clamp(Math.round(avgDamage / 7 + avgKills * 8));
  const consistency = clamp(Math.round(avgKills * 12 + n(player.win_rate) * 0.35));
  const clutch = clamp(Math.round(mvpCount * 12));
  const support = clamp(Math.round(totalAssists * 1.2 + totalRevives * 3));
  const impactScore = Math.round (totalKills * 0.35 + avgDamage * 0.2 + mvpCount * 8 + totalAssists * 0.1 + totalKnocks * 0.15);
  const latestHistoryRank = rankHistory[rankHistory.length - 1]?.rank || 0;
  const currentRank = currentRanking?.rank || latestHistoryRank || 0;
  const historyPreviousRank = rankHistory[rankHistory.length - 2]?.rank || currentRank;
  const historyMovement = historyPreviousRank - currentRank;
  const movement = currentRanking?.change ?? historyMovement;
  let archetype = "Balanced Fighter";
  if (aggression >= 85) archetype = "Entry Fragger";
  else if (clutch >= 80) archetype = "Clutch Specialist";
  else if (support >= 70) archetype = "Support Anchor";
  else if (consistency >= 80) archetype = "Reliable Core";
  const recentKills = recentMatches.reduce((sum, match) => sum + n(match.kills),0);
  const recentDamage = recentMatches.reduce((sum, match) => sum + n(match.damage),0);
  const recentFormScore = Math.round(recentKills * 2 + recentDamage / 100);
  const playerSourceLabel = player.source === "krafton_india_esports"? "Official Krafton Player" : player.verified? "Verified Player" : "Player Record";
  const teamSourceLabel = player.team?.source === "krafton_india_esports"? "Official Krafton Team" : player.team?.verified? "Verified Team" : "Team Record";
  const playerSource = getSourceLabel(player.source);
  const teamName = player.team?.name || "Free Agent";
  const latestRankingUpdate = currentRanking?.updated_at || getLatestDate(rankHistory.map((row) => row.snapshot_date)) || getLatestDate(rankHistory.map((row) => row.created_at)) || null;
  const confidence = getPlayerConfidence(totalMatches);

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <PlayerAvatar ign={player.ign} role={player.role} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">Player Profile</p>
              <h1 className="mt-2 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">{player.ign}</h1>
              <p className="mt-3 text-white/45">{teamName} · {player.role || "Player"} ·{" "}{player.country || "India"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <DataSourceBadge source={player.source} verified={player.verified} label={playerSourceLabel}/> 
                {player.team ? 
                  (
                    <DataSourceBadge source={player.team.source} verified={player.team.verified} label={teamSourceLabel}/>
                 ) : null
                }
                <DataSourceBadge label="Ranking Snapshot" />
                <DataSourceBadge label={confidence.label} />
                <DataSourceBadge label={`Last Updated: ${formatDate(latestRankingUpdate)}`} />
                <ActiveBadge active={player.active} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/players/compare?player1=${player.slug}`}className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15">
              Compare Player
            </Link>

            {player.team?.slug ? 
              (
                <Link href={`/teams/${player.team.slug}`}className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
                  View Team
                </Link>
              ) : null
            }
            <Link href="/rankings"className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
              Rankings
            </Link>
            <Link href="/data"className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
              Data Trust
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Rank" value={currentRank ? `#${currentRank}` : "—"} />
        <Metric label="Rank Change"value={formatChange(movement)}muted/>
        <Metric label="Impact Score" value={impactScore} />
        <Metric label="Kills" value={totalKills} />
        <Metric label="Avg Damage" value={formatValue(avgDamage)} />
        <Metric label="KD" value={formatValue(player.kd_ratio, 2)} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={card + " p-6"}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Ranking History</p>
              <h2 className="mt-2 text-2xl font-black text-white">Rank Movement</h2>
              <div className="mt-3">
                <DataSourceBadge label="Ranking Snapshot" />
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${changeTone(movement)}`}>{formatChange(movement)}</p>
              <p className="text-xs text-white/35">Movement</p>
            </div>
          </div>
          {rankHistory.length > 0 ? 
            (
              <RankHistoryChart history={rankHistory} />
            ) 
            : 
            (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">No ranking history available yet.</p>
            )
          }
        </section>
        <section className={card + " p-6"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Player DNA</p>
              <h2 className="mt-2 text-2xl font-black text-white">{archetype}</h2>
            </div>
            <DataSourceBadge label="Analytics Generated" />
          </div>
          <div className="mt-6 space-y-5">
            <Bar label="Aggression" value={aggression} />
            <Bar label="Consistency" value={consistency} />
            <Bar label="Clutch" value={clutch} />
            <Bar label="Support" value={support} />
          </div>
        </section>
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className={card + " p-6"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Recent Form</p>
              <h2 className="mt-2 text-2xl font-black text-white">Last 5 Matches</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#ffd21a]">{recentFormScore}</p>
              <p className="text-xs text-white/35">Form Score</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {recentMatches.length > 0 ? 
              (recentMatches.map
                ((match, index) => match.match_id ? 
                  (
                    <Link key={`${match.id}-${index}`}href={`/match/${match.match_id}`}className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-black text-white transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30"title={`Kills: ${match.kills || 0}, Damage: ${match.damage || 0}`}>
                      {match.kills || 0}
                    </Link>
                  ) 
                  : 
                  (
                    <div key={`${match.id}-${index}`}className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-black text-white">
                      {match.kills || 0}
                    </div>
                  )
                )
              ) 
              : 
              (
                <p className="text-sm text-white/40">No recent matches found.</p>
              )
            }
          </div>
        </section>
        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Scout Verdict</p>
              <h2 className="mt-2 text-2xl font-black text-white">Performance Read</h2>
            </div>
            <DataSourceBadge label="Analytics Generated" />
          </div>
          <p className="mt-5 leading-7 text-white/60">
            <span className="font-bold text-white">{player.ign}</span> profiles
            as a{" "}
            <span className="font-bold text-[#ffd21a]">{archetype}</span>. The
            current impact score is{" "}
            <span className="font-bold text-white">{impactScore}</span>, backed
            by {formatValue(avgDamage)} average damage and{" "}
            {formatValue(avgKills, 1)} average kills per match.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Metric label="Record Source" value={playerSource} muted />
            <Metric label="Team Link" value={teamName} muted />
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">Data Context</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              This profile uses normalized PlayRank player, ranking, roster and
              match records. API-imported stats are only included after promotion
              safety checks. {confidence.description} PlayRank analytics are
              independent intelligence signals, not official predictions or outcome
              guarantees.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}