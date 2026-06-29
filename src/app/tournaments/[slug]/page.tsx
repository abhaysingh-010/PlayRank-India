import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TournamentRow = 
{
  id: string;
  name: string;
  slug: string;
  organizer: string | null;
  location: string | null;
  status: string | null;
  prize_pool: number | string | null;
  participating_teams: number | null;
  start_date: string | null;
  end_date: string | null;
  logo_url: string | null;
  source: string | null;
  source_url: string | null;
  verified: boolean | null;
  created_at: string | null;
};

type TeamMini = 
{
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  country: string | null;
  global_rank: number | null;
  logo_url: string | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

type StandingRow = 
{
  id: string;
  tournament_id: string;
  team_id: string;
  rank: number | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  team: TeamMini | null;
};

type StandingRaw = Omit<StandingRow, "team"> & 
{
  team: TeamMini | TeamMini[] | null;
};

type MatchRow = 
{
  id: string;
  tournament_id: string;
  team1_id: string | null;
  team2_id: string | null;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  source: string | null;
  verified: boolean | null;
  team1: TeamMini | null;
  team2: TeamMini | null;
  winner: TeamMini | null;
};

type MatchRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & 
{
  team1: TeamMini | TeamMini[] | null;
  team2: TeamMini | TeamMini[] | null;
  winner: TeamMini | TeamMini[] | null;
};

type PlayerMini = 
{
  id: string;
  ign: string;
  slug: string;
  source?: string | null;
  verified?: boolean | null;
};

type PlayerStatRow = 
{
  player_id: string;
  match_id: string;
  kills: number | null;
  damage: number | null;
  assists: number | null;
  revives: number | null;
  is_mvp: boolean | null;
  mvp: boolean | null;
  player: PlayerMini | null;
};

type PlayerStatRaw = Omit<PlayerStatRow, "player"> & 
{
  player: PlayerMini | PlayerMini[] | null;
};

type FeaturedPlayer = 
{
  player: PlayerMini;
  kills: number;
  damage: number;
  assists: number;
  revives: number;
  mvp: number;
  matches: number;
  impact: number;
};

const card = "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";
const softCard = "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
function one<T>(value: T | T[] | null): T | null 
{
  if (Array.isArray(value)) return value[0] || null;
  return value;
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

  return date.toLocaleDateString("en-IN", 
  {
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

function formatDateRange(start: string | null, end: string | null) 
{
  if (!start && !end) return "Dates TBD";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  return `${formatDate(start)} - ${formatDate(end)}`;
}
function formatMoney(value: unknown) 
{
  const safe = n(value);
  if (!safe) return "TBD";
  if (safe >= 10000000) return `₹${(safe / 10000000).toFixed(1)}Cr`;
  if (safe >= 100000) return `₹${(safe / 100000).toFixed(1)}L`;
  return `₹${safe.toLocaleString("en-IN")}`;
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

function getStatusClass(status: string | null) 
{
  const safeStatus = (status || "").toLowerCase();
  if (safeStatus.includes("live") || safeStatus.includes("ongoing")) 
  {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }
  if (safeStatus.includes("complete") || safeStatus.includes("ended")) 
  {
    return "border-white/10 bg-white/[0.04] text-white/45";
  } 
  if (safeStatus.includes("cancel")) 
  {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }
  return "border-[#ffd21a]/25 bg-[#ffd21a]/10 text-[#ffd21a]";
}
function getTournamentBadgeLabel(tournament: TournamentRow) 
{
  if (tournament.source === "krafton_india_esports") 
  {
    return "Official Krafton Event";
  }
  if (tournament.verified) return "Verified Event";
  return "Tournament Record";
}

function getTournamentConfidence
(
  {
    verified,
    standingsCount,
    matchCount,
  }
  : 
  {
    verified: boolean | null;
    standingsCount: number;
    matchCount: number;
  }
) 
{
  if (verified && standingsCount >= 12 && matchCount >= 10) 
  {
    return {
      label: "High Confidence",
      description:
        "This tournament has verified source status, standings coverage and meaningful match volume.",
    };
  }

  if (standingsCount >= 6 || matchCount >= 5) 
  {
    return {
      label: "Medium Confidence",
      description:
        "This tournament has usable standings or match data, but some analytics should still be read directionally.",
    };
  }

  return {
    label: "Low Confidence",
    description:
      "This tournament has limited standings or match data. Treat analytics as early directional signals.",
  };
}

function getTeamBadgeLabel(team?: TeamMini | null) 
{
  if (!team) return "Team Record";
  if (team.source === "krafton_india_esports") return "Official Krafton Team";
  if (team.verified) return "Verified Team";
  return "Team Record";
}
function getPlayerBadgeLabel(player?: PlayerMini | null) 
{
  if (!player) return "Player Record";
  if (player.source === "krafton_india_esports") return "Official Krafton Player";
  if (player.verified) return "Verified Player";
  return "Player Record";
}
function getRowStyle(rank: number | null) 
{
  if (rank === 1) return "bg-yellow-400/[0.055] hover:bg-yellow-400/[0.08]";
  if (rank === 2) return "bg-slate-300/[0.045] hover:bg-slate-300/[0.07]";
  if (rank === 3) return "bg-orange-400/[0.05] hover:bg-orange-400/[0.075]";
  return "hover:bg-white/[0.025]";
}
function getRankPillStyle(rank: number | null) 
{
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  return "border-white/10 bg-white/[0.035] text-white/75";
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
        <span className="font-bold text-white/80">{safeValue}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#ffd21a]"style={{ width: `${safeValue}%` }}/>
      </div>
    </div>
  );
}
function TournamentLogo
(
  {
    name,
    logoUrl,
    size = "lg",
  }
  : 
  {
    name: string;
    logoUrl: string | null;
    size?: "md" | "lg";
  }
) 
{
  const sizeClass = size === "lg" ? "h-24 w-24" : "h-12 w-12";
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
      {
        logoUrl ? 
        (
          <Image src={logoUrl} alt={`${name} logo`} width={96} height={96} sizes={size === "lg" ? "96px" : "48px"} className="h-full w-full object-contain p-3"/>
        ) 
        : 
        (
          <span className="text-lg font-black text-white/75">{getInitials(name)}</span>
        )
      }
    </div>
  );
}
function TeamLogo
(
  {
    name,
    logoUrl,
  }
  : 
  {
    name: string;
    logoUrl: string | null;
  }
) 
{
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      {logoUrl ? 
        (
          <Image src={logoUrl} alt={`${name} logo`} width={44} height={44} sizes="44px" className="h-full w-full object-contain p-2"/>
        ) 
        : 
        (
          <span className="text-xs font-black text-white/70">{getInitials(name)}</span>
        )
      }
    </div>
  );
}
function PodiumCard
(
  {
    label,
    standing,
    tone,
  }
  : 
  {
    label: string;
    standing: StandingRow | undefined;
    tone: "gold" | "silver" | "bronze";
  }
) 
{
  const toneClass = tone === "gold"
  ? "border-yellow-400/20 bg-yellow-400/[0.055] text-yellow-300" 
  : tone === "silver"
  ? "border-slate-300/20 bg-slate-300/[0.045] text-slate-200"
  : "border-orange-400/20 bg-orange-400/[0.05] text-orange-300";
  return (
    <article className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-80">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <TeamLogo name={standing?.team?.name || "Team"} logoUrl={standing?.team?.logo_url || null}/>
        <div className="min-w-0">
          {standing?.team?.slug ? 
            (
              <Link href={`/teams/${standing.team.slug}`}className="line-clamp-1 text-lg font-black text-white hover:underline">
                {standing.team.name}
              </Link>
            ) 
            : 
            (
              <p className="line-clamp-1 text-lg font-black text-white">{standing?.team?.name || "—"}</p>
            )
          }
          <p className="mt-1 text-sm text-white/45">{standing?.points ?? 0} pts · {standing?.kills ?? 0} kills</p>
        </div>
      </div>
    </article>
  );
}
function aggregateFeaturedPlayer(rows: PlayerStatRow[]) 
{
  const map = new Map<string, FeaturedPlayer>();
  for (const row of rows) 
  {
    if (!row.player) continue;
    const existing =map.get(row.player_id) ||
    (
      {
        player: row.player,
        kills: 0,
        damage: 0,
        assists: 0,
        revives: 0,
        mvp: 0,
        matches: 0,
        impact: 0,
      } satisfies FeaturedPlayer
    );
    existing.kills += n(row.kills);
    existing.damage += n(row.damage);
    existing.assists += n(row.assists);
    existing.revives += n(row.revives);
    existing.mvp += row.is_mvp || row.mvp ? 1 : 0;
    existing.matches += 1;
    existing.impact = existing.kills * 100 + existing.damage + existing.assists * 20 + existing.revives * 30 + existing.mvp * 500;
    map.set(row.player_id, existing);
  }
  return [...map.values()].sort((a, b) => b.impact - a.impact)[0] || null;
}
function MatchCard({ match }: { match: MatchRow }) 
{
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">{match.stage || "Match"}</p>
          <h3 className="mt-2 line-clamp-1 text-base font-black text-white">
            {match.team1?.name || "Team 1"}
            <span className="px-2 text-white/25">vs</span>
            {match.team2?.name || "Team 2"}
          </h3>
          <p className="mt-2 text-sm text-white/40">{match.map_name || "Map N/A"} · {formatDate(match.date)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-white">
            {match.team1_score ?? 0}
            <span className="px-2 text-white/25">-</span>
            {match.team2_score ?? 0}
          </p>
          <p className="mt-1 text-xs text-white/40">Winner:{" "}<span className="font-bold text-[#ffd21a]">{match.winner?.name || "N/A"}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <DataSourceBadge source={match.source}verified={match.verified}label={match.verified ? "Verified Match" : "Match Record"}/>
        <Link href={`/match/${match.id}`}className="text-xs font-black text-white/45 transition hover:text-[#ffd21a]">View →</Link>
      </div>
    </article>
  );
}

export default async function TournamentPage
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
  const { data: tournamentRaw, error: tournamentError } = await supabase
  .from("tournaments")
  .select("*")
  .eq("slug", slug)
  .single();
  if (tournamentError || !tournamentRaw) {notFound();}
  const tournament = tournamentRaw as TournamentRow;
  const [standingsResult, matchesResult] = await Promise.all
  (
    [
      supabase
      .from("tournament_standings")
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
            country,
            global_rank,
            logo_url,
            source,
            verified,
            active
          )
        `
      )
      .eq("tournament_id", tournament.id)
      .order("rank", { ascending: true }),

      supabase
      .from("matches")
      .select
      (
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
          verified,
          team1:team1_id 
          (
            id,
            name,
            slug,
            logo_url,
            short_name,
            country,
            global_rank,
            source,
            verified,
            active
          ),
          team2:team2_id 
          (
            id,
            name,
            slug,
            logo_url,
            short_name,
            country,
            global_rank,
            source,
            verified,
            active
          ),
          winner:winner_team_id 
          (
            id,
            name,
            slug,
            logo_url,
            short_name,
            country,
            global_rank,
            source,
            verified,
            active
          )
        `
      )
      .eq("tournament_id", tournament.id)
      .order("date", { ascending: false }),
    ]
  );
  const standings = ((standingsResult.data || []) as StandingRaw[]).map
  (
    (row) => 
      (
        {
          ...row,
          team: one(row.team),
        }
      )
  ) as StandingRow[];
  const matches = ((matchesResult.data || []) as MatchRaw[]).map
  (
    (row) => 
    (
      {
        ...row,
        team1: one(row.team1),
        team2: one(row.team2),
        winner: one(row.winner),
      }
    )
  ) as MatchRow[];
  const matchIds = matches.map((match) => match.id);
  const playerStatsResult = matchIds.length > 0 ? await supabase
  .from("player_match_stats")
  .select
  (
    `
      player_id,
      match_id,
      kills,
      damage,
      assists,
      revives,
      is_mvp,
      mvp,
      player:player_id 
      (
        id,
        ign,
        slug,
        source,
        verified
      )
    `
  )
  .in("match_id", matchIds) : { data: [], error: null };
  const playerStats = ((playerStatsResult.data || []) as PlayerStatRaw[]).map
  (
    (row) => 
    (
      {
        ...row,
        player: one(row.player),
      }
    )
  ) as PlayerStatRow[];
  const featuredPlayer = aggregateFeaturedPlayer(playerStats);
  const champion = standings[0];
  const runnerUp = standings[1];
  const thirdPlace = standings[2];
  const totalKills = standings.reduce((sum, team) => sum + n(team.kills), 0) || playerStats.reduce((sum, row) => sum + n(row.kills), 0);
  const totalWins = standings.reduce((sum, team) => sum + n(team.wins), 0);
  const totalMatches = matches.length || standings.reduce((sum, team) => sum + n(team.matches_played), 0);
  const top5Teams = standings.slice(0, 5);
  const powerRankings = top5Teams
  .map
  (
    (team) => 
    {
      const powerScore = n(team.points) * 0.45 + n(team.kills) * 0.35 + n(team.wins) * 12;
      return {...team,powerScore: Math.round(powerScore),};
    }
  )
  .sort((a, b) => b.powerScore - a.powerScore);
  const powerLeader = powerRankings[0];
  const difficultyIndex = standings.length > 0? Math.round(standings.reduce((sum, item) => sum + n(item.points) + n(item.kills),0) / standings.length): 0;
  const difficultyLabel = difficultyIndex > 250 ? "Elite" : difficultyIndex > 150 ? "Hard" : "Moderate";
  const championOutput = champion? Math.round(n(champion.points) * 0.6 + n(champion.kills) * 0.4) : 0;
  const killPressure = clamp(Math.round(totalKills / Math.max(1, standings.length || 1)));
  const winDensity = clamp(Math.round(totalWins * 9));
  const matchVolume = clamp(Math.round(totalMatches * 8));
  const difficultyScore = clamp(Math.round(difficultyIndex / 3));
  const tournamentConfidence = getTournamentConfidence({
  verified: tournament.verified,
  standingsCount: standings.length,
  matchCount: matches.length,
});

const latestTournamentUpdate = getLatestDate([
  tournament.created_at,
  tournament.end_date,
  tournament.start_date,
  ...matches.map((match) => match.date),
]);

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <TournamentLogo name={tournament.name}logoUrl={tournament.logo_url}/>
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <DataSourceBadge source={tournament.source} verified={tournament.verified} label={getTournamentBadgeLabel(tournament)} size="md"/>
                <DataSourceBadge label="Standings Data" size="md" />
                <DataSourceBadge label="Match Data" size="md" />
                <DataSourceBadge label="Tournament Intelligence" size="md" />
                <DataSourceBadge label={tournamentConfidence.label} size="md" />
                <DataSourceBadge label={`Last Updated: ${formatDate(latestTournamentUpdate)}`} size="md" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">Tournament Profile</p>
              <h1 className="mt-2 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">{tournament.name}</h1>
              <p className="mt-4 text-white/45">
                {tournament.organizer || "Organizer N/A"} ·{" "}
                {tournament.location || "Location N/A"} ·{" "}
                {formatDateRange(tournament.start_date, tournament.end_date)}
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-white/45">
                {tournamentConfidence.description} PlayRank tournament analytics are
                independent intelligence signals generated from available tournament,
                standings, match and player-stat records. They are not official predictions,
                betting tips or outcome guarantees.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className={`rounded-full border px-5 py-2.5 text-sm font-black uppercase tracking-[0.12em] ${getStatusClass(tournament.status)}`}>
              {tournament.status || "Status N/A"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/65">
              {formatMoney(tournament.prize_pool)}
            </span>
            <Link href="/data"className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
              Data Trust
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Teams"value={tournament.participating_teams || standings.length || "—"}/>
        <Metric label="Matches" value={totalMatches} />
        <Metric label="Total Kills" value={totalKills} />
        <Metric label="WWCD" value={totalWins} />
        <Metric label="Prize Pool" value={formatMoney(tournament.prize_pool)} muted />
        <Metric label="Difficulty" value={difficultyLabel} muted />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <PodiumCard label="Champion" standing={champion} tone="gold" />
        <PodiumCard label="Runner Up" standing={runnerUp} tone="silver" />
        <PodiumCard label="Third Place" standing={thirdPlace} tone="bronze" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={card + " p-6"}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <DataSourceBadge label="Tournament Intelligence" />
                <DataSourceBadge label="Analytics Generated" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Competitive Read</p>
              <h2 className="mt-2 text-2xl font-black text-white">Event Difficulty</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#ffd21a]">{difficultyIndex}</p>
              <p className="text-xs text-white/35">Difficulty Index</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Power Leader"value={powerLeader?.team?.short_name || powerLeader?.team?.name ||"—"}/>
            <Metric label="Champion Output" value={championOutput} />
            <Metric label="Tier" value={difficultyLabel} muted />
          </div>
          <div className="mt-6 space-y-5">
            <Bar label="Kill Pressure" value={killPressure} />
            <Bar label="Win Density" value={winDensity} />
            <Bar label="Match Volume" value={matchVolume} />
            <Bar label="Difficulty" value={difficultyScore} />
          </div>
        </section>
        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Featured Player</p>
              <h2 className="mt-2 text-2xl font-black text-white">{featuredPlayer?.player.ign || "—"}</h2>
            </div>
            <DataSourceBadge label="Tournament Player Stats" />
          </div>
          <div className="mt-4">
            <DataSourceBadge source={featuredPlayer?.player.source}verified={featuredPlayer?.player.verified}label={getPlayerBadgeLabel(featuredPlayer?.player)}/>
          </div>
          <p className="mt-4 leading-7 text-white/55">
            Featured player is calculated from player match stats linked to this
            tournament’s matches. The impact score weights kills, damage,
            assists, revives and MVP flags.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Metric label="Impact" value={featuredPlayer?.impact ?? 0} />
            <Metric label="Kills" value={featuredPlayer?.kills ?? 0} muted />
            <Metric label="Damage" value={featuredPlayer?.damage ?? 0} />
            <Metric label="Matches" value={featuredPlayer?.matches ?? 0} muted />
          </div>
          {featuredPlayer?.player.slug ? 
            (
              <Link href={`/players/${featuredPlayer.player.slug}`}className="mt-5 inline-flex rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15">
                View Player
              </Link>
            ) : null
          }
        </section>
      </section>
      <section className={card + " p-6"}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Power Rankings" />
              <DataSourceBadge label="Analytics Generated" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Power Rankings</p>
            <h2 className="mt-2 text-2xl font-black text-white">Top Tournament Teams</h2>
          </div>
          <p className="text-sm text-white/35">Top 5 by tournament output</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {powerRankings.length > 0 ? 
            (powerRankings.map
              (
                (team, index) => 
                (
                  <article key={team.id}className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.05]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-white/35">#{index + 1}</span>
                      <p className="text-2xl font-black text-[#ffd21a]">{team.powerScore}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <TeamLogo name={team.team?.name || "Team"}logoUrl={team.team?.logo_url || null}/>
                      <div className="min-w-0">
                        {team.team?.slug ? 
                            (
                              <Link href={`/teams/${team.team.slug}`}className="line-clamp-1 font-black text-white hover:underline">{team.team.name}</Link>
                            ) 
                            : 
                            (
                              <p className="line-clamp-1 font-black text-white">Team N/A</p>
                            )
                          }
                        <p className="mt-1 text-xs text-white/35">{team.points || 0} pts · {team.kills || 0} kills</p>
                      </div>
                    </div>
                  </article>
                )
              )
            ) 
            : 
            (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45 md:col-span-2 xl:col-span-5">
                No power ranking data available yet.
              </p>
            )
          }
        </div>
      </section>
      <section className={card + " overflow-hidden"}>
        <div className="flex flex-col gap-2 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Standings Data" />
              <DataSourceBadge label="Tournament Table" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Standings</p>
            <h2 className="mt-2 text-2xl font-black text-white">Tournament Table</h2>
          </div>
        </div>
        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">WWCD</th>
                <th className="px-6 py-4 text-right">Matches</th>
              </tr>
            </thead>
            <tbody>
              {standings.length > 0 ? 
                (standings.map
                  ((standing) => 
                    (
                      <tr key={standing.id}className={`border-b border-white/[0.06] transition ${getRowStyle(standing.rank)}`}>
                        <td className="px-6 py-5">
                          <span className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyle(standing.rank)}`}>#{standing.rank || "—"}</span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <TeamLogo name={standing.team?.name || "Team"}logoUrl={standing.team?.logo_url || null}/>
                            <div>
                              {standing.team?.slug ? 
                                (
                                  <Link href={`/teams/${standing.team.slug}`}className="font-bold text-white hover:underline">{standing.team.name}</Link>
                                ) 
                                : 
                                (
                                  <p className="font-bold text-white">Team N/A</p>
                                )
                              }
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">{standing.team?.short_name || standing.team?.country ||"TEAM"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <DataSourceBadge source={standing.team?.source}verified={standing.team?.verified}label={getTeamBadgeLabel(standing.team)}/>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-white">{standing.points ?? 0}</td>
                        <td className="px-6 py-5 text-right text-white/65">{standing.kills ?? 0}</td>
                        <td className="px-6 py-5 text-right text-white/45">{standing.wins ?? 0}</td>
                        <td className="px-6 py-5 text-right text-white/45">{standing.matches_played ?? 0}</td>
                      </tr>
                    )
                  )
                ) 
                : 
                (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-white/45">No standings available yet.</td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </section>
      <section className={card + " p-6"}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Match Data" />
              <DataSourceBadge label="Tournament Matches" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Matches</p>
            <h2 className="mt-2 text-2xl font-black text-white">Tournament Matches
            </h2>
          </div>
          <p className="text-sm text-white/35">{matches.length} matches</p>
        </div>
        {matches.length > 0 ? 
          (
            <div className="grid gap-3 md:grid-cols-2">
              {matches.map
                ((match) => 
                  (
                    <MatchCard key={match.id} match={match} />
                  )
                )
              }
            </div>
          ) 
          : 
          (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">No tournament matches available yet.</p>
          )
        }
      </section>
    </main>
  );
}