import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TeamMini = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  global_rank: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type TournamentMini = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  logo_url: string | null;
  source: string | null;
  verified: boolean | null;
};

type StandingRow = {
  id: string;
  tournament_id: string | null;
  team_id: string;
  rank: number | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  team: TeamMini | null;
};

type StandingRaw = Omit<StandingRow, "team"> & {
  team: TeamMini | TeamMini[] | null;
};

type LeaderboardTeam = TeamMini & {
  totalPoints: number;
  totalKills: number;
  totalWins: number;
  totalMatches: number;
  tournamentsPlayed: number;
  bestRank: number | null;
  latestTournamentId: string | null;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getRankPillStyle(rank: number | null) {
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank && rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

  return "border-white/10 bg-white/[0.035] text-white/75";
}

function getRowStyle(rank: number | null) {
  if (rank === 1) return "bg-yellow-400/[0.055] hover:bg-yellow-400/[0.08]";
  if (rank === 2) return "bg-slate-300/[0.045] hover:bg-slate-300/[0.07]";
  if (rank === 3) return "bg-orange-400/[0.05] hover:bg-orange-400/[0.075]";

  return "hover:bg-white/[0.025]";
}

function getTeamBadgeLabel(team?: TeamMini | null) {
  if (!team) return "Team Record";
  if (team.source === "krafton_india_esports") return "Official Krafton Team";
  if (team.verified) return "Verified Team";
  return "Team Record";
}

function getTournamentBadgeLabel(tournament?: TournamentMini | null) {
  if (!tournament) return "Tournament Record";
  if (tournament.source === "krafton_india_esports") return "Official Krafton Event";
  if (tournament.verified) return "Verified Event";
  return "Tournament Record";
}

function getStatusClass(status: string | null) {
  const safeStatus = (status || "").toLowerCase();

  if (safeStatus.includes("live") || safeStatus.includes("ongoing")) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (safeStatus.includes("complete") || safeStatus.includes("ended")) {
    return "border-white/10 bg-white/[0.04] text-white/45";
  }

  if (safeStatus.includes("cancel")) {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-[#ffd21a]/25 bg-[#ffd21a]/10 text-[#ffd21a]";
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

function TeamLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
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

function TournamentLogo({
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
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-[10px] font-black text-white/70">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function aggregateLeaderboard(rows: StandingRow[]) {
  const teamMap = new Map<string, LeaderboardTeam>();

  for (const row of rows) {
    if (!row.team) continue;

    const existing =
      teamMap.get(row.team_id) ||
      ({
        ...row.team,
        totalPoints: 0,
        totalKills: 0,
        totalWins: 0,
        totalMatches: 0,
        tournamentsPlayed: 0,
        bestRank: null,
        latestTournamentId: null,
      } satisfies LeaderboardTeam);

    existing.totalPoints += n(row.points);
    existing.totalKills += n(row.kills);
    existing.totalWins += n(row.wins);
    existing.totalMatches += n(row.matches_played);
    existing.tournamentsPlayed += 1;
    existing.latestTournamentId = row.tournament_id;

    if (row.rank) {
      existing.bestRank =
        existing.bestRank === null ? row.rank : Math.min(existing.bestRank, row.rank);
    }

    teamMap.set(row.team_id, existing);
  }

  return [...teamMap.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.totalKills - a.totalKills;
  });
}

function PodiumCard({
  rank,
  team,
}: {
  rank: number;
  team: LeaderboardTeam | undefined;
}) {
  const label = rank === 1 ? "Leader" : rank === 2 ? "Runner Up" : "Third";
  const tone =
    rank === 1
      ? "border-yellow-400/20 bg-yellow-400/[0.055] text-yellow-300"
      : rank === 2
        ? "border-slate-300/20 bg-slate-300/[0.045] text-slate-200"
        : "border-orange-400/20 bg-orange-400/[0.05] text-orange-300";

  return (
    <article className={`rounded-3xl border p-5 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-80">
        {label}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <TeamLogo name={team?.name || "Team"} logoUrl={team?.logo_url || null} />

        <div className="min-w-0">
          {team?.slug ? (
            <Link
              href={`/teams/${team.slug}`}
              className="line-clamp-1 text-lg font-black text-white hover:underline"
            >
              {team.short_name || team.name}
            </Link>
          ) : (
            <p className="line-clamp-1 text-lg font-black text-white">—</p>
          )}

          <p className="mt-1 text-sm text-white/45">
            {team?.totalPoints ?? 0} pts · {team?.totalKills ?? 0} kills
          </p>
        </div>
      </div>
    </article>
  );
}

function TournamentMiniCard({
  tournament,
  rows,
}: {
  tournament: TournamentMini;
  rows: StandingRow[];
}) {
  const sortedRows = rows
    .slice()
    .sort((a, b) => n(a.rank, 999) - n(b.rank, 999))
    .slice(0, 3);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <TournamentLogo name={tournament.name} logoUrl={tournament.logo_url} />

          <div className="min-w-0">
            <Link
              href={`/tournaments/${tournament.slug}`}
              className="line-clamp-1 font-black text-white hover:underline"
            >
              {tournament.name}
            </Link>

            <p className="mt-1 text-xs text-white/35">
              {rows.length} standing rows
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusClass(
            tournament.status
          )}`}
        >
          {tournament.status || "Event"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <DataSourceBadge
          source={tournament.source}
          verified={tournament.verified}
          label={getTournamentBadgeLabel(tournament)}
        />
      </div>

      <div className="mt-5 space-y-2">
        {sortedRows.length > 0 ? (
          sortedRows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${getRankPillStyle(row.rank)}`}>
                #{row.rank || "—"}
              </span>

              <div className="flex min-w-0 items-center gap-2">
                <TeamLogo
                  name={row.team?.name || "Team"}
                  logoUrl={row.team?.logo_url || null}
                />

                {row.team?.slug ? (
                  <Link
                    href={`/teams/${row.team.slug}`}
                    className="truncate text-sm font-black text-white hover:underline"
                  >
                    {row.team.short_name || row.team.name}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-black text-white">Team N/A</p>
                )}
              </div>

              <span className="text-xs font-black text-[#ffd21a]">
                {row.points ?? 0}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/40">No rows available.</p>
        )}
      </div>
    </article>
  );
}

export default async function StandingsPage() {
  const [standingsResult, tournamentsResult] = await Promise.all([
    supabase
      .from("tournament_standings")
      .select(
        `
        id,
        tournament_id,
        team_id,
        rank,
        points,
        kills,
        wins,
        matches_played,
        team:team_id (
          id,
          name,
          short_name,
          slug,
          country,
          logo_url,
          global_rank,
          source,
          verified,
          active
        )
      `
      )
      .order("rank", { ascending: true }),

    supabase
      .from("tournaments")
      .select("id, name, slug, status, logo_url, source, verified")
      .order("created_at", { ascending: false }),
  ]);

  if (standingsResult.error) {
    return (
      <main className="page-shell py-10">
        <section className={card + " p-8"}>
          <h1 className="text-2xl font-black text-white">Team Standings</h1>

          <p className="mt-3 text-red-300">
            Failed to load standings. Check Supabase query, relationships, or
            selected columns.
          </p>
        </section>
      </main>
    );
  }

  const standings = ((standingsResult.data || []) as StandingRaw[]).map(
    (row) => ({
      ...row,
      team: one(row.team),
    })
  ) as StandingRow[];

  const tournaments = (tournamentsResult.data || []) as TournamentMini[];

  const tournamentById = new Map(
    tournaments.map((tournament) => [tournament.id, tournament])
  );

  const rowsByTournament = new Map<string, StandingRow[]>();

  for (const row of standings) {
    if (!row.tournament_id) continue;

    const existing = rowsByTournament.get(row.tournament_id) || [];
    existing.push(row);
    rowsByTournament.set(row.tournament_id, existing);
  }

  const leaderboard = aggregateLeaderboard(standings);

  const totalPoints = leaderboard.reduce(
    (sum, team) => sum + n(team.totalPoints),
    0
  );

  const totalKills = leaderboard.reduce(
    (sum, team) => sum + n(team.totalKills),
    0
  );


  const verifiedTeams = leaderboard.filter((team) => team.verified === true).length;

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              PlayRank Standings Hub
            </p>

            <h1 className="mt-2 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
              Team
              <br />
              Standings
            </h1>

            <p className="mt-4 max-w-3xl leading-7 text-white/45">
              Explore aggregate standings across tournaments, tournament-level
              tables, team logos, source badges and performance totals.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <DataSourceBadge label="Tournament Standings" />
              <DataSourceBadge label="Team Logos" />
              <DataSourceBadge label="Data Trust Layer" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tournaments"
              className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              Tournaments
            </Link>

            <Link
              href="/rankings"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              Rankings
            </Link>

            <Link
              href="/data"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              Data Trust
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Metric label="Teams" value={leaderboard.length} />
        <Metric label="Standing Rows" value={standings.length} />
        <Metric label="Tournaments" value={rowsByTournament.size} />
        <Metric label="Verified Teams" value={verifiedTeams} />
        <Metric label="Points" value={totalPoints} muted />
        <Metric label="Kills" value={totalKills} muted />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <PodiumCard rank={1} team={leaderboard[0]} />
        <PodiumCard rank={2} team={leaderboard[1]} />
        <PodiumCard rank={3} team={leaderboard[2]} />
      </section>

      <section className={card + " overflow-hidden"}>
        <div className="flex flex-col gap-2 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Aggregate Table" />
              <DataSourceBadge label="Across Tournaments" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Global Standings
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Aggregate Team Leaderboard
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Aggregated from tournament standing rows. Sorted by total points,
              then total kills.
            </p>
          </div>

          <p className="text-sm text-white/35">{leaderboard.length} teams</p>
        </div>

        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">WWCD</th>
                <th className="px-6 py-4 text-right">Matches</th>
                <th className="px-6 py-4 text-right">Events</th>
                <th className="px-6 py-4 text-right">Best Rank</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`border-b border-white/[0.06] transition ${getRowStyle(
                      index + 1
                    )}`}
                  >
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyle(
                          index + 1
                        )}`}
                      >
                        #{index + 1}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <TeamLogo name={team.name} logoUrl={team.logo_url} />

                        <div>
                          <Link
                            href={`/teams/${team.slug}`}
                            className="font-bold text-white hover:underline"
                          >
                            {team.short_name || team.name}
                          </Link>

                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                            {team.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={team.source}
                        verified={team.verified}
                        label={getTeamBadgeLabel(team)}
                      />
                    </td>

                    <td className="px-6 py-5 text-right font-black text-white">
                      {team.totalPoints}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {team.totalKills}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {team.totalWins}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {team.totalMatches}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {team.tournamentsPlayed}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      #{team.bestRank || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-white/45">
                    No standings available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card + " p-6"}>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Tournament Tables" />
              <DataSourceBadge label="Top 3 Preview" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Tournament Views
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Tournament Standings Preview
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Quick view of the top teams in each tournament table.
            </p>
          </div>

          <p className="text-sm text-white/35">
            {rowsByTournament.size} tournaments
          </p>
        </div>

        {rowsByTournament.size > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[...rowsByTournament.entries()].map(([tournamentId, rows]) => {
              const tournament = tournamentById.get(tournamentId);

              if (!tournament) return null;

              return (
                <TournamentMiniCard
                  key={tournamentId}
                  tournament={tournament}
                  rows={rows}
                />
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No tournament standings available yet.
          </p>
        )}
      </section>
    </main>
  );
}