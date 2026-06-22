import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  id: string;
  entity_id: string;
  entity_type: string;
  rank: number;
  score: number;
  change: number | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_url: string | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  total_kills: number | null;
  avg_damage: number | null;
  mvp_count: number | null;
  team: {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
  } | null;
};

type PlayerRowRaw = Omit<PlayerRow, "team"> & {
  team: {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
  }[] | null;
};

type MatchRow = {
  id: string;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1: {
    name: string;
    slug: string;
  }[] | null;
  team2: {
    name: string;
    slug: string;
  }[] | null;
  winner: {
    name: string;
    slug: string;
  }[] | null;
};

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  organizer: string | null;
  location: string | null;
  status: string | null;
  prize_pool: number | string | null;
  participating_teams: number | null;
  start_date: string | null;
};

const ecosystemModules = [
  {
    title: "Rankings Intelligence",
    label: "Official competitive order",
    description:
      "Track team and player rank movement with verified scoring, snapshots and competitive context.",
    href: "/rankings",
    cta: "View Rankings",
  },
  {
    title: "Team Intelligence",
    label: "Roster and team strength",
    description:
      "Analyze team output, rank value, wins, kills, momentum and tournament consistency.",
    href: "/teams",
    cta: "Explore Teams",
  },
  {
    title: "Player Intelligence",
    label: "Individual impact layer",
    description:
      "Profile fraggers, IGLs, support players and MVP performers through structured player data.",
    href: "/players",
    cta: "Explore Players",
  },
  {
    title: "Match Intelligence",
    label: "Performance timeline",
    description:
      "Read match results, team output, MVP impact, score gaps and combat performance signals.",
    href: "/matches",
    cta: "View Matches",
  },
  {
    title: "Tournament Intelligence",
    label: "Event and standings layer",
    description:
      "Understand tournament standings, podium finishes, prize context and team performance paths.",
    href: "/tournaments",
    cta: "View Events",
  },
  {
    title: "Compare Intelligence",
    label: "Competitive edge engine",
    description:
      "Compare teams and players through overall edge, combat matrix and momentum analytics.",
    href: "/compare",
    cta: "Start Comparing",
  },
];

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: unknown) {
  const safe = n(value);
  if (!safe) return "TBD";

  return `₹${safe.toLocaleString("en-IN")}`;
}

function formatScore(value: unknown) {
  const safe = n(value);

  if (safe >= 1000) {
    return `${(safe / 1000).toFixed(1)}k`;
  }

  return Math.round(safe).toString();
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
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-xs font-black text-white/70">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function PlayerAvatar({ ign }: { ign: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
      <span className="text-xs font-black text-white/70">
        {getInitials(ign)}
      </span>
    </div>
  );
}

function RankPill({ rank }: { rank: number }) {
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-2 text-xs font-black text-white/70">
      #{rank}
    </span>
  );
}

function SectionTitle({
  kicker,
  title,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="krafton-label">{kicker}</p>

        <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
          {title}
        </h2>
      </div>

      {href && cta ? (
        <Link
          href={href}
          className="w-fit text-sm font-black uppercase tracking-[0.18em] text-white/50 transition hover:text-[#ff4038]"
        >
          {cta} →
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [
    { data: teamRankingsRaw },
    { data: playerRankingsRaw },
    { count: playerCount },
    { count: teamCount },
    { count: matchCount },
    { count: tournamentCount },
    { data: recentMatchesRaw },
    { data: activeTournamentsRaw },
  ] = await Promise.all([
    supabase
      .from("rankings")
      .select("id, entity_id, entity_type, rank, score, change")
      .eq("entity_type", "team")
      .order("rank", { ascending: true })
      .limit(6),

    supabase
      .from("rankings")
      .select("id, entity_id, entity_type, rank, score, change")
      .eq("entity_type", "player")
      .order("rank", { ascending: true })
      .limit(6),

    supabase.from("players").select("*", { count: "exact", head: true }),

    supabase.from("teams").select("*", { count: "exact", head: true }),

    supabase.from("matches").select("*", { count: "exact", head: true }),

    supabase.from("tournaments").select("*", { count: "exact", head: true }),

    supabase
      .from("matches")
      .select(
        `
        id,
        map_name,
        stage,
        date,
        team1_score,
        team2_score,
        team1:team1_id (
          name,
          slug
        ),
        team2:team2_id (
          name,
          slug
        ),
        winner:winner_team_id (
          name,
          slug
        )
      `
      )
      .order("date", { ascending: false })
      .limit(4),

    supabase
      .from("tournaments")
      .select(
        "id, name, slug, organizer, location, status, prize_pool, participating_teams, start_date"
      )
      .order("start_date", { ascending: false })
      .limit(3),
  ]);

  const teamRankings = (teamRankingsRaw || []) as RankingRow[];
  const playerRankings = (playerRankingsRaw || []) as RankingRow[];
  const recentMatches = (recentMatchesRaw || []) as MatchRow[];
  const activeTournaments = (activeTournamentsRaw || []) as TournamentRow[];

  const teamIds = teamRankings.map((item) => item.entity_id);
  const playerIds = playerRankings.map((item) => item.entity_id);

  let teams: TeamRow[] = [];
  let players: PlayerRow[] = [];

  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("teams")
      .select(
        "id, name, short_name, slug, logo_url, points, wins, kills, matches_played"
      )
      .in("id", teamIds);

    teams = (data || []) as TeamRow[];
  }

  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("players")
      .select(
        `
        id,
        ign,
        slug,
        role,
        total_kills,
        avg_damage,
        mvp_count,
        team:team_id (
          id,
          name,
          slug,
          short_name
        )
      `
      )
      .in("id", playerIds);

    const rawPlayers = (data || []) as PlayerRowRaw[];
    players = rawPlayers.map((player) => ({
      ...player,
      team: player.team && player.team.length > 0 ? player.team[0] : null,
    }));
  }

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const playerById = new Map(players.map((player) => [player.id, player]));

  const trendingTeams = teamRankings
    .map((ranking) => {
      const team = teamById.get(ranking.entity_id);
      return team ? { ranking, team } : null;
    })
    .filter(
      (item): item is { ranking: RankingRow; team: TeamRow } => Boolean(item)
    );

  const trendingPlayers = playerRankings
    .map((ranking) => {
      const player = playerById.get(ranking.entity_id);
      return player ? { ranking, player } : null;
    })
    .filter(
      (item): item is { ranking: RankingRow; player: PlayerRow } =>
        Boolean(item)
    );

  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* HERO */}
      <section className="krafton-grid relative min-h-[calc(100vh-82px)] overflow-hidden">
        <div className="blueprint-lines" />

        <div className="absolute left-[41%] top-[22%] hidden h-[420px] w-[420px] border border-white/20 opacity-30 lg:block" />
        <div className="absolute left-[43%] top-[31%] hidden h-[280px] w-[520px] -skew-x-12 border border-white/20 opacity-30 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-82px)] max-w-[1600px] flex-col justify-center px-7 pb-20 pt-0 md:px-14">
          <h1 className="krafton-display max-w-[1600px] text-[16vw] md:text-[10.5vw] xl:text-[9.8rem]">
            PIONEER
            <br />
            THE
            <br />
            COMPETITIVE
            <br />
            LAYER
          </h1>

          <div className="mt-8 flex max-w-5xl items-start gap-6">
            <p className="max-w-4xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white md:text-xl">
              We pioneer the path to competitive intelligence. With rankings,
              team analysis, player impact and match data, we build the esports
              layer for India’s next generation of competitors.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/rankings" className="btn-primary px-6 py-3 text-sm">View Rankings</Link>
            <Link href="/compare" className="btn-secondary px-6 py-3 text-sm">Compare Intelligence</Link>
          </div>
        </div>
      </section>
      {/* STATS */}
      <section className="border-y border-white/10 bg-black px-7 py-8 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div>
            <p className="data-label">Teams</p>
            <p className="mt-2 text-5xl font-black text-white">{teamCount || 0}</p>
          </div>
          <div>
            <p className="data-label">Players</p>
            <p className="mt-2 text-5xl font-black text-white">{playerCount || 0}</p>
          </div>
          <div>
            <p className="data-label">Matches</p>
            <p className="mt-2 text-5xl font-black text-white">{matchCount || 0}</p>
          </div>
          <div>
            <p className="data-label">Tournaments</p>
            <p className="mt-2 text-5xl font-black text-white">{tournamentCount || 0}</p>
          </div>
        </div>
      </section>
      {/* ECOSYSTEM */}
      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <SectionTitle kicker="PlayRank Ecosystem" title="Intelligence Modules" />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ecosystemModules.map
              ((module, index) => 
                (
                    <Link key={module.title}href={module.href}className="krafton-card group min-h-[310px] p-7">
                    <div className="flex items-start justify-between gap-5">
                      <p className="text-sm font-black uppercase tracking-[0.28em] text-[#ff4038]">{module.label}</p>
                      <span className="text-sm font-black text-white/30">0{index + 1}</span>
                    </div>
                    <h3 className="mt-8 text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-white">{module.title}</h3>
                    <p className="mt-6 max-w-sm leading-7 text-white/45">{module.description}</p>
                    <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-white/45 group-hover:text-[#ff4038]">{module.cta} →</p>
                  </Link>
                )
              )
            }
        </div>
      </section>
      {/* RANKINGS */}
      <section className="border-y border-white/10 bg-[#050505]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-7 py-24 md:px-14 xl:grid-cols-2">
          <div>
            <SectionTitle kicker="Rankings"title="Top Teams"href="/teams"cta="View Teams"/>
            <div className="space-y-0 border border-white/10">
              {trendingTeams.length > 0 ? 
                (
                  trendingTeams.map
                  (({ ranking, team }) => 
                    (
                      <Link key={ranking.id}href={`/teams/${team.slug}`}className="flex items-center justify-between border-b border-white/10 bg-[#111] p-5 last:border-b-0 hover:bg-[#171717]">
                        <div className="flex min-w-0 items-center gap-4">
                          <RankPill rank={ranking.rank} />
                          <TeamLogo name={team.name} logoUrl={team.logo_url} />
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">{team.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">{team.short_name || "TEAM"}</p>
                          </div>
                        </div>
                        <p className="font-black text-[#ff4038]">{formatScore(ranking.score)}</p>
                      </Link>
                    )
                  )
                ) 
                :
                (
                  <p className="p-5 text-white/45">No team rankings available.</p>
                )
              }
            </div>
          </div>
          <div>
            <SectionTitle kicker="Rankings"title="Top Players"href="/players"cta="View Players"/>
            <div className="space-y-0 border border-white/10">
              {trendingPlayers.length > 0 ? (
                trendingPlayers.map(({ ranking, player }) => (
                  <Link
                    key={ranking.id}
                    href={`/players/${player.slug}`}
                    className="flex items-center justify-between border-b border-white/10 bg-[#111] p-5 last:border-b-0 hover:bg-[#171717]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <RankPill rank={ranking.rank} />
                      <PlayerAvatar ign={player.ign} />

                      <div className="min-w-0">
                        <p className="truncate font-black text-white">
                          {player.ign}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                          {player.role || player.team?.short_name || "PLAYER"}
                        </p>
                      </div>
                    </div>

                    <p className="font-black text-[#ff4038]">
                      {formatScore(ranking.score)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="p-5 text-white/45">
                  No player rankings available.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MATCHES + TOURNAMENTS */}
      <section className="mx-auto grid max-w-[1600px] gap-10 px-7 py-24 md:px-14 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionTitle
            kicker="Match Center"
            title="Recent Matches"
            href="/matches"
            cta="View Matches"
          />

          <div className="grid gap-5 md:grid-cols-2">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="krafton-card p-6"
                >
                  <p className="data-label">{match.stage || "Match"}</p>

                  <h3 className="mt-4 text-xl font-black text-white">
                    {match.team1?.[0]?.name || "Team 1"}
                    <span className="px-2 text-white/25">vs</span>
                    {match.team2?.[0]?.name || "Team 2"}
                  </h3>

                  <p className="mt-5 text-3xl font-black text-white">
                    {match.team1_score ?? 0}
                    <span className="px-3 text-white/20">:</span>
                    {match.team2_score ?? 0}
                  </p>

                  <p className="mt-4 text-sm text-white/40">
                    {match.map_name || "Map N/A"} · {formatDate(match.date)}
                  </p>

                  <p className="mt-3 text-sm font-black text-[#ff4038]">
                    Winner · {match.winner?.[0]?.name || "Pending"}
                  </p>
                </Link>
              ))
            ) : (
              <p className="border border-white/10 bg-[#111] p-6 text-white/45 md:col-span-2">
                No recent matches available.
              </p>
            )}
          </div>
        </div>

        <div>
          <SectionTitle
            kicker="Tournament Layer"
            title="Latest Events"
            href="/tournaments"
            cta="View All"
          />

          <div className="space-y-5">
            {activeTournaments.length > 0 ? (
              activeTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.slug}`}
                  className="krafton-card block p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-black text-white">
                        {tournament.name}
                      </p>
                      <p className="mt-2 text-sm text-white/40">
                        {tournament.location || "Location N/A"} ·{" "}
                        {formatDate(tournament.start_date)}
                      </p>
                    </div>

                    <span className="border border-[#ff4038]/30 bg-[#ff4038]/10 px-3 py-1 text-xs font-black text-[#ff4038]">
                      {tournament.status || "TBD"}
                    </span>
                  </div>

                  <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-sm">
                    <span className="text-white/40">Prize Pool</span>
                    <span className="font-black text-white">
                      {formatMoney(tournament.prize_pool)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="border border-white/10 bg-[#111] p-6 text-white/45">
                No tournaments available.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-10 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="krafton-label">Why PlayRank</p>

            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              Built For
              <br />
              Serious
              <br />
              Esports
            </h2>
          </div>

          <div className="max-w-4xl">
            <p className="text-2xl font-black uppercase leading-8 tracking-[-0.04em] text-white md:text-4xl md:leading-[1.05]">
              PlayRank turns India’s esports data into a connected intelligence
              system — ranking teams, profiling players, reading matches and
              comparing competitive edge in one product layer.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="border border-white/10 bg-[#111] p-5">
                <p className="data-label">Source Layer</p>
                <p className="mt-3 text-lg font-black text-white">
                  Official rankings, verified teams and structured match data.
                </p>
              </div>

              <div className="border border-white/10 bg-[#111] p-5">
                <p className="data-label">Analysis Layer</p>
                <p className="mt-3 text-lg font-black text-white">
                  Rankings, momentum, combat matrix and performance channels.
                </p>
              </div>

              <div className="border border-white/10 bg-[#111] p-5">
                <p className="data-label">Product Layer</p>
                <p className="mt-3 text-lg font-black text-white">
                  Teams, players, matches, tournaments and comparison flows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="krafton-grid relative overflow-hidden border-t border-white/10 px-7 py-20 text-center md:px-14">
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="krafton-label">PlayRank</p>

          <h2 className="krafton-title mt-4 text-6xl text-white md:text-8xl">
            Own The
            <br />
            Competitive Layer
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/45">
            A connected intelligence system for BGMI rankings, teams, players,
            matches and tournaments.
          </p>

          <div className="mt-9 flex justify-center gap-3">
            <Link href="/teams" className="btn-primary px-6 py-3 text-sm">
              Explore Teams
            </Link>

            <Link href="/matches" className="btn-secondary px-6 py-3 text-sm">
              View Matches
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}