import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TeamMini = 
{
  name: string;
  slug: string;
  logo_url: string | null;
};

type MatchResultTeam = 
{
  name: string;
  slug: string;
  logo_url: string | null;
};

type MatchResultRow = 
{
  match_id: string;
  team_id: string;
  placement: number | null;
  kills: number | null;
  total_points: number | null;
  team: MatchResultTeam | MatchResultTeam[] | null;
};

type NormalizedMatchResultRow = Omit<MatchResultRow, "team"> & 
{
  team: MatchResultTeam | null;
};

type MatchRow = 
{
  id: string;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1_score: number | null;
  team2_score: number | null;
  source: string | null;
  source_url: string | null;
  verified: boolean | null;
  created_at: string | null;
  team1: TeamMini | null;
  team2: TeamMini | null;
  winner: TeamMini | null;
};

type MatchRowRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & 
{
  team1: TeamMini | TeamMini[] | null;
  team2: TeamMini | TeamMini[] | null;
  winner: TeamMini | TeamMini[] | null;
};

const card = "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard = "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function one<T>(value: T | T[] | null): T | null 
{
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function formatDate(value: string | null) 
{
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString
  ("en-IN", 
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
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

function getMatchType(match: MatchRow, resultRows: NormalizedMatchResultRow[]) 
{
  if (match.team1 || match.team2) return "Head-to-Head";
  if (resultRows.length > 0) return "Battle Royale";
  return "Match Record";
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

function TeamLogo
(
  {
    team,
    won = false,
  }
  : 
  {
    team: TeamMini | null;
    won?: boolean;
  }
) 
{
  const teamName = team?.name || "Team N/A";
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${won? "border-[#ffd21a]/30 bg-[#ffd21a]/10 text-[#ffd21a]" : "border-white/10 bg-white/[0.04] text-white/65"}`}>
      {team?.logo_url ? 
        (  
          <img src={team.logo_url}alt={`${teamName} logo`}className="h-full w-full object-contain p-2"/>
        ) 
        : 
        (
          <span className="text-sm font-black">{getInitials(teamName)}</span>
        )
      }
    </div>
  );
}

function TeamBadge
(
  {
    team,
    align = "left",
    won = false,
  }
  : 
  {
    team: TeamMini | null;
    align?: "left" | "right";
    won?: boolean;
  }
) 
{
  const teamName = team?.name || "Team N/A";

  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo team={team} won={won} />
      <div className="min-w-0">
        {team?.slug ? 
          (
            <Link href={`/teams/${team.slug}`} className="truncate font-black text-white hover:underline">{teamName}</Link>
          )
          : 
          (
            <p className="truncate font-black text-white">{teamName}</p>
          )
        }
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/30">{won ? "Winner" : "Team"}</p>
      </div>
    </div>
  );
}

function MatchResultPreview
(
  {
    rows,
  }
  : 
  {
    rows: NormalizedMatchResultRow[];
  }
) 
{
  const visibleRows = rows
  .slice()
  .sort((a, b) => n(a.placement, 999) - n(b.placement, 999))
  .slice(0, 4);

  if (visibleRows.length === 0) 
  {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-sm text-white/40">Team result rows are not available for this match yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {visibleRows.map
        ((row) => 
          (
            <div key={`${row.match_id}-${row.team_id}`}className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <span className="rounded-full border border-[#ffd21a]/25 bg-[#ffd21a]/10 px-2.5 py-1 text-xs font-black text-[#ffd21a]">#{row.placement ?? "—"}</span>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  {row.team?.logo_url ? 
                    (
                      <img src={row.team.logo_url} alt={`${row.team.name} logo`} className="h-full w-full object-contain p-1.5"/>
                    ) 
                    : 
                    (
                      <span className="text-xs font-black text-white/60">{getInitials(row.team?.name || "Team")}</span>
                    )
                  }
                </div>
                {row.team?.slug ? 
                  (
                    <Link href={`/teams/${row.team.slug}`}className="truncate text-sm font-black text-white hover:underline">{row.team.name}</Link>
                  ) 
                  : 
                  (
                    <p className="truncate text-sm font-black text-white">Team N/A</p>
                  )
                }
              </div>
              <span className="text-xs font-bold text-white/50">K {row.kills ?? 0}</span>
              <span className="text-xs font-bold text-white/50">PTS {row.total_points ?? 0}</span>
            </div>
          )
        )
      }
    </div>
  );
}

function HeadToHeadScore({ match }: { match: MatchRow }) 
{
  const team1Score = n(match.team1_score);
  const team2Score = n(match.team2_score);
  const team1Won = Boolean(match.winner?.slug) && match.winner?.slug === match.team1?.slug;
  const team2Won = Boolean(match.winner?.slug) && match.winner?.slug === match.team2?.slug;

  return (
    <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
      <TeamBadge team={match.team1} won={team1Won} />
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-center">
        <p className="text-3xl font-black tracking-tight text-white">
          <span className={team1Won ? "text-[#ffd21a]" : ""}>
            {team1Score}
          </span>
          <span className="px-3 text-white/20">:</span>
          <span className={team2Won ? "text-[#ffd21a]" : ""}>
            {team2Score}
          </span>
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/30">
          Scoreline
        </p>
      </div>
      <TeamBadge team={match.team2} align="right" won={team2Won} />
    </div>
  );
}

function MatchCard
(
  {
    match,
    resultRows,
  }
  : 
  {
    match: MatchRow;
    resultRows: NormalizedMatchResultRow[];
  }
) 
{
  const matchType = getMatchType(match, resultRows);
  const hasHeadToHead = Boolean(match.team1 || match.team2);
  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.035]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.08),transparent_30%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge source={match.source} verified={match.verified}label={match.source === "pubg_developer_api"? "PUBG API Promoted" : match.verified? "Verified Match" : "Match Record"}/>
              <DataSourceBadge label={matchType} />
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-white/35">{match.stage || "Match"}</p>
            <p className="mt-1 text-sm text-white/35">{match.map_name || "Map N/A"}</p>
          </div>
          <p className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-white/45">{formatDate(match.date)}</p>
        </div>
        {hasHeadToHead ? 
          (
            <HeadToHeadScore match={match} />
          ) 
          : 
          (
            <MatchResultPreview rows={resultRows} />
          )
        }
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">Winner</p>
              <p className="mt-1 font-black text-[#ffd21a]">{match.winner?.name || resultRows.find((row) => row.placement === 1)?.team?.name || "Pending"}</p>
            </div>
            <Link href={`/match/${match.id}`}className="text-sm font-black text-white/45 transition hover:text-[#ffd21a]">View match →</Link>
          </div>
        </div>
      </article>
    );
  }

  export default async function MatchesPage() 
  {
    const { data, error } = await supabase
    .from("matches")
    .select
    (
      `
        id,
        map_name,
        stage,
        date,
        team1_score,
        team2_score,
        source,
        source_url,
        verified,
        created_at,
        team1:team1_id 
        (
          name,
          slug,
          logo_url
        ),
        team2:team2_id 
        (
          name,
          slug,
          logo_url
        ),
        winner:winner_team_id 
        (
          name,
          slug,
          logo_url
        )
      `
    )
    .order("date", { ascending: false });

    if (error) 
    {
      return (
        <main className="page-shell py-10">
          <section className={card + " p-8"}>
            <h1 className="text-2xl font-black text-white">Match Center</h1>
            <p className="mt-3 text-red-300">
              Failed to load matches. Check Supabase query, table permissions, or
              selected columns.
            </p>
          </section>
        </main>
      );
    }

    const rawMatches = (data || []) as MatchRowRaw[];

    const matches = rawMatches.map
    (
      (match) => 
      (
        {
          ...match,
          team1: one(match.team1),
          team2: one(match.team2),
          winner: one(match.winner), 
        }
      )
    ) as MatchRow[];

    const matchIds = matches.map((match) => match.id);
    const resultsResult = matchIds.length > 0? await supabase
    .from
    (
      "team_match_results"
    )
    .select
    (
      `
        match_id,
        team_id,
        placement,
        kills,
        total_points,
        team:team_id 
        (
          name,
          slug,
          logo_url
        )
      `
    )
    .in
    (
      "match_id", matchIds
    ) : { data: [], error: null };
    const matchResults = ((resultsResult.data || []) as MatchResultRow[]).map
    (
      (row) => 
      (
        {
          ...row,
          team: one(row.team),
        }
      )
    ) as NormalizedMatchResultRow[];
    const resultsByMatchId = new Map<string, NormalizedMatchResultRow[]>();
    for (const row of matchResults) 
    {
      const existing = resultsByMatchId.get(row.match_id) || []; existing.push(row); resultsByMatchId.set(row.match_id, existing);
    }

    const completedMatches = matches.filter
    (
      (match) =>match.team1_score !== null || match.team2_score !== null || (resultsByMatchId.get(match.id) || []).length > 0
    )
    .length;

    const verifiedMatches = matches.filter
    (
      (match) => match.verified === true
    )
    .length;

    const pubgApiMatches = matches.filter
    (
      (match) => match.source === "pubg_developer_api" || match.source === "pubg_api"
    )
    .length;

    const totalMaps = new Set
    (
      matches.map((match) => match.map_name).filter(Boolean)
    )
    .size;

    const totalStages = new Set
    (
      matches.map((match) => match.stage).filter(Boolean)
    )
    .size;

    return (
      <main className="page-shell space-y-6 py-8 text-white">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">PlayRank Match Center</p>
              <h1 className="mt-2 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
                Match
                <br />
                Intelligence
              </h1>
              <p className="mt-4 max-w-3xl leading-7 text-white/45">
                Explore completed matches, promoted API records, winners, maps,
                stages and team performance outputs across PlayRank.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <DataSourceBadge label="Match Records" />
                <DataSourceBadge label="Team Results" />
                <DataSourceBadge source="pubg_api" label="PUBG API Aware" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/compare" className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15">
                Compare Center
              </Link>

              <Link href="/data" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white">
                Data Trust
              </Link>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Matches" value={matches.length} />
          <Metric label="Completed" value={completedMatches} />
          <Metric label="Verified" value={verifiedMatches} />
          <Metric label="PUBG API" value={pubgApiMatches} />
          <Metric label="Maps" value={totalMaps || "—"} muted />
          <Metric label="Stages" value={totalStages || "—"} muted />
        </section>
        <section className={card + " p-6"}>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Recent Match Records" />
                <DataSourceBadge label="Result Preview" />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-white/35">Matches</p>
              <h2 className="mt-2 text-2xl font-black text-white">Recent Matches
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Head-to-head matches show scorelines. Battle Royale style records
                show the top team result rows when available.
              </p>
            </div>
            <p className="text-sm text-white/35">{matches.length} matches</p>
          </div>
          {matches.length > 0 ? 
            (
              <div className="grid gap-4 lg:grid-cols-2">
                {matches.map
                  (
                    (match) => 
                    (
                      <MatchCard key={match.id}match={match}resultRows={resultsByMatchId.get(match.id) || []}/>
                    )
                  )
                }
              </div>
            ) 
            : 
            (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">No matches available yet.</p>
            )
          }
        </section>
      </main>
    );
  }