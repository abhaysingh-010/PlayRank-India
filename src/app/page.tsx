import Link from "next/link";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

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
  source: string | null;
  verified: boolean | null;
};

type PlayerTeam = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  source: string | null;
  verified: boolean | null;
  team: PlayerTeam | null;
};

type PlayerRowRaw = Omit<PlayerRow, "team"> & {
  team: PlayerTeam | PlayerTeam[] | null;
};

type MatchTeam = {
  name: string;
  slug: string;
};

type MatchRow = {
  id: string;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1: MatchTeam | null;
  team2: MatchTeam | null;
  winner: MatchTeam | null;
};

type MatchRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & {
  team1: MatchTeam | MatchTeam[] | null;
  team2: MatchTeam | MatchTeam[] | null;
  winner: MatchTeam | MatchTeam[] | null;
};

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  start_date: string | null;
};

const quickLinks = [
  {
    label: "Rankings",
    href: "/rankings",
    description: "Team and player competitive order.",
  },
  {
    label: "Teams",
    href: "/teams",
    description: "Profiles, rosters and team strength.",
  },
  {
    label: "Players",
    href: "/players",
    description: "Impact, role and performance data.",
  },
  {
    label: "Compare",
    href: "/compare",
    description: "Find the edge between teams or players.",
  },
];

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

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

function formatScore(value: number | null | undefined) {
  const safe = n(value);

  if (safe >= 1000) return `${(safe / 1000).toFixed(1)}k`;

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

function Logo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
      <span className="text-xs font-black text-white/70">
        {getInitials(ign)}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function SignalRow({
  label,
  title,
  meta,
  href,
  right,
  children,
}: {
  label: string;
  title: string;
  meta: string;
  href: string;
  right?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.045]"
    >
      <div className="flex min-w-0 items-center gap-3">
        {children}

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            {label}
          </p>
          <p className="mt-1 truncate font-black text-white">{title}</p>
          <p className="mt-1 truncate text-sm text-white/40">{meta}</p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {right ? (
          <p className="font-black text-[#ffd21a]">{right}</p>
        ) : null}

        <p className="mt-1 text-xs font-black text-white/25 transition group-hover:text-[#ffd21a]">
          Open
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [
    teamRankingResult,
    playerRankingResult,
    playerCountResult,
    teamCountResult,
    matchCountResult,
    tournamentCountResult,
    recentMatchResult,
    tournamentResult,
  ] = await Promise.all([
    supabase
      .from("rankings")
      .select("id, entity_id, entity_type, rank, score, change")
      .eq("entity_type", "team")
      .order("rank", { ascending: true })
      .limit(1),

    supabase
      .from("rankings")
      .select("id, entity_id, entity_type, rank, score, change")
      .eq("entity_type", "player")
      .order("rank", { ascending: true })
      .limit(1),

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
      .limit(1),

    supabase
      .from("tournaments")
      .select("id, name, slug, status, start_date")
      .order("start_date", { ascending: false })
      .limit(1),
  ]);

  const topTeamRanking = (teamRankingResult.data || [])[0] as
    | RankingRow
    | undefined;

  const topPlayerRanking = (playerRankingResult.data || [])[0] as
    | RankingRow
    | undefined;

  let topTeam: TeamRow | null = null;
  let topPlayer: PlayerRow | null = null;

  if (topTeamRanking?.entity_id) {
    const { data } = await supabase
      .from("teams")
      .select("id, name, short_name, slug, logo_url, source, verified")
      .eq("id", topTeamRanking.entity_id)
      .maybeSingle();

    topTeam = (data || null) as TeamRow | null;
  }

  if (topPlayerRanking?.entity_id) {
    const { data } = await supabase
      .from("players")
      .select(
        `
        id,
        ign,
        slug,
        role,
        source,
        verified,
        team:team_id (
          id,
          name,
          slug,
          short_name
        )
      `
      )
      .eq("id", topPlayerRanking.entity_id)
      .maybeSingle();

    const rawPlayer = data as PlayerRowRaw | null;

    topPlayer = rawPlayer
      ? {
          ...rawPlayer,
          team: one(rawPlayer.team),
        }
      : null;
  }

  const recentMatch = ((recentMatchResult.data || []) as MatchRaw[]).map(
    (match) => ({
      ...match,
      team1: one(match.team1),
      team2: one(match.team2),
      winner: one(match.winner),
    })
  )[0] as MatchRow | undefined;

  const latestTournament = (tournamentResult.data || [])[0] as
    | TournamentRow
    | undefined;

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="BGMI" size="md" />
              <DataSourceBadge label="Rankings" size="md" />
              <DataSourceBadge label="Stats" size="md" />
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.075em] text-white md:text-7xl">
              Esports data,
              <br />
              made readable.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/52 md:text-lg">
              PlayRank gives Indian BGMI fans, teams and scouts a clean way to
              read rankings, teams, players, matches and tournaments.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
              >
                Explore Rankings
              </Link>

              <Link
                href="/compare"
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
              >
                Compare
              </Link>

              <Link
                href="/matches"
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
              >
                Matches
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
                  Live Pulse
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Competitive snapshot
                </h2>
              </div>

              <DataSourceBadge label="Updated" />
            </div>

            <div className="grid grid-cols-4 gap-4 border-b border-white/10 py-5">
              <Metric label="Teams" value={teamCountResult.count || 0} />
              <Metric label="Players" value={playerCountResult.count || 0} />
              <Metric label="Matches" value={matchCountResult.count || 0} />
              <Metric label="Events" value={tournamentCountResult.count || 0} />
            </div>

            <div className="space-y-3 pt-5">
              {topTeam && topTeamRanking ? (
                <SignalRow
                  label="Top Team"
                  title={topTeam.name}
                  meta={`#${topTeamRanking.rank} in team rankings`}
                  right={formatScore(topTeamRanking.score)}
                  href={`/teams/${topTeam.slug}`}
                >
                  <Logo name={topTeam.name} logoUrl={topTeam.logo_url} />
                </SignalRow>
              ) : null}

              {topPlayer && topPlayerRanking ? (
                <SignalRow
                  label="Top Player"
                  title={topPlayer.ign}
                  meta={topPlayer.role || topPlayer.team?.short_name || "Player"}
                  right={`#${topPlayerRanking.rank}`}
                  href={`/players/${topPlayer.slug}`}
                >
                  <PlayerAvatar ign={topPlayer.ign} />
                </SignalRow>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.5rem] border border-white/10 bg-[#080a0f] p-5 transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.035]"
            >
              <h3 className="text-xl font-black text-white">{item.label}</h3>

              <p className="mt-3 text-sm leading-6 text-white/42">
                {item.description}
              </p>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/30 transition group-hover:text-[#ffd21a]">
                Open
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-14 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd21a]">
                Latest
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Match update
              </h2>
            </div>

            <Link
              href="/matches"
              className="text-sm font-black text-white/35 transition hover:text-[#ffd21a]"
            >
              All matches
            </Link>
          </div>

          {recentMatch ? (
            <Link
              href={`/match/${recentMatch.id}`}
              className="block rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.045]"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                {recentMatch.stage || "Match"} ·{" "}
                {recentMatch.map_name || "Map N/A"}
              </p>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-x-5 gap-y-3">
                <p className="truncate text-lg font-black text-white">
                  {recentMatch.team1?.name || "Team 1"}
                </p>
                <p className="text-lg font-black text-white">
                  {recentMatch.team1_score ?? 0}
                </p>

                <p className="truncate text-lg font-black text-white">
                  {recentMatch.team2?.name || "Team 2"}
                </p>
                <p className="text-lg font-black text-white">
                  {recentMatch.team2_score ?? 0}
                </p>
              </div>

              <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/42">
                Winner:{" "}
                <span className="font-black text-[#ffd21a]">
                  {recentMatch.winner?.name || "Pending"}
                </span>{" "}
                · {formatDate(recentMatch.date)}
              </p>
            </Link>
          ) : (
            <p className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 text-white/45">
              No recent matches available.
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffd21a]">
                Event
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Latest tournament
              </h2>
            </div>

            <Link
              href="/tournaments"
              className="text-sm font-black text-white/35 transition hover:text-[#ffd21a]"
            >
              All events
            </Link>
          </div>

          {latestTournament ? (
            <Link
              href={`/tournaments/${latestTournament.slug}`}
              className="block rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.045]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-white">
                    {latestTournament.name}
                  </p>

                  <p className="mt-2 text-sm text-white/42">
                    Starts {formatDate(latestTournament.start_date)}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-[#ffd21a]/25 bg-[#ffd21a]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#ffd21a]">
                  {latestTournament.status || "TBD"}
                </span>
              </div>

              <p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/42">
                Open event page for standings, matches and team performance.
              </p>
            </Link>
          ) : (
            <p className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 text-white/45">
              No tournaments available.
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#050609]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-white/45">
            Start with rankings, open profiles, check recent matches, then use
            compare to understand the competitive edge.
          </p>

          <div className="flex flex-wrap gap-4 text-sm font-black">
            <Link href="/standings" className="text-white/40 hover:text-[#ffd21a]">
              Standings
            </Link>
            <Link href="/data" className="text-white/40 hover:text-[#ffd21a]">
              Data Trust
            </Link>
            <Link href="/tournaments" className="text-white/40 hover:text-[#ffd21a]">
              Events
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}