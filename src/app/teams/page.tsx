import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
  global_rank: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

const PAGE_SIZE = 10;

function toValidPage(value: string | undefined) {
  const page = Number(value || "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
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
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-sm font-black tracking-tight text-white/70">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function getTopTeamCardStyles(rank: number) {
  if (rank === 1) {
    return {
      card: "border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 via-[#15110a] to-[#0b0d12] shadow-[0_0_34px_rgba(250,204,21,0.24)]",
      badge: "border-yellow-400/30 bg-yellow-400/15 text-yellow-300",
      accent: "text-yellow-300",
      glow: "bg-yellow-400/20",
    };
  }

  if (rank === 2) {
    return {
      card: "border-slate-300/25 bg-gradient-to-br from-slate-300/14 via-[#101216] to-[#0b0d12] shadow-[0_0_30px_rgba(226,232,240,0.17)]",
      badge: "border-slate-300/25 bg-slate-300/10 text-slate-200",
      accent: "text-slate-200",
      glow: "bg-slate-300/15",
    };
  }

  if (rank === 3) {
    return {
      card: "border-orange-400/25 bg-gradient-to-br from-orange-500/16 via-[#14100d] to-[#0b0d12] shadow-[0_0_28px_rgba(251,146,60,0.2)]",
      badge: "border-orange-400/25 bg-orange-400/10 text-orange-300",
      accent: "text-orange-300",
      glow: "bg-orange-400/15",
    };
  }

  return {
    card: "border-white/10 bg-[#0b0d12] shadow-[0_0_22px_rgba(16,185,129,0.08)] hover:shadow-[0_0_30px_rgba(16,185,129,0.14)]",
    badge: "border-white/10 bg-white/[0.04] text-white",
    accent: "text-white",
    glow: "bg-emerald-400/10",
  };
}

function getTableRowStyles(rank: number) {
  if (rank === 1) {
    return "bg-yellow-400/[0.055] hover:bg-yellow-400/[0.08]";
  }

  if (rank === 2) {
    return "bg-slate-300/[0.045] hover:bg-slate-300/[0.07]";
  }

  if (rank === 3) {
    return "bg-orange-400/[0.05] hover:bg-orange-400/[0.075]";
  }

  return "hover:bg-white/[0.025]";
}

function getRankPillStyles(rank: number) {
  if (rank === 1) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (rank === 2) {
    return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  }

  if (rank === 3) {
    return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  }

  return "border-white/10 bg-white/[0.035] text-white/75";
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = toValidPage(resolvedSearchParams?.page);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: topRankingsRaw, error: topRankingsError } = await supabase
    .from("rankings")
    .select("entity_id, rank, score, change")
    .eq("entity_type", "team")
    .order("rank", { ascending: true })
    .range(0, 9);

  const {
    data: pageRankingsRaw,
    error: pageRankingsError,
    count,
  } = await supabase
    .from("rankings")
    .select("entity_id, rank, score, change", { count: "exact" })
    .eq("entity_type", "team")
    .order("rank", { ascending: true })
    .range(from, to);

  const topRankings = (topRankingsRaw || []) as RankingRow[];
  const pageRankings = (pageRankingsRaw || []) as RankingRow[];

  const allTeamIds = Array.from(
    new Set([
      ...topRankings.map((row) => row.entity_id),
      ...pageRankings.map((row) => row.entity_id),
    ])
  );

  const { data: teamsRaw, error: teamsError } = await supabase
    .from("teams")
    .select(
      "id, name, short_name, slug, country, logo_url, points, wins, kills, matches_played, global_rank, source, verified, active"
    )
    .in("id", allTeamIds);

  const teams = (teamsRaw || []) as TeamRow[];
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const topTeams = topRankings
    .map((ranking) => ({
      ranking,
      team: teamById.get(ranking.entity_id),
    }))
    .filter((item) => item.team);

  const tableTeams = pageRankings
    .map((ranking) => ({
      ranking,
      team: teamById.get(ranking.entity_id),
    }))
    .filter((item) => item.team);

  const totalRows = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (topRankingsError || pageRankingsError || teamsError) {
    return (
      <main className="page-shell">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <h1 className="text-2xl font-bold text-white">Teams</h1>
          <p className="mt-3 text-red-300">
            Failed to load teams. Check Supabase query, table permissions, or
            selected columns.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-10">
      <br />
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 shadow-2xl md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
              Team Rankings
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-xs text-white/40">Teams</p>
              <p className="mt-1 text-2xl font-black text-white">
                {totalRows}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-xs text-white/40">Top</p>
              <p className="mt-1 text-2xl font-black text-white">10</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-xs text-white/40">Source</p>
              <p className="mt-1 text-sm font-bold text-white">KIE</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Link
              href="/teams/compare"
              className="w-fit rounded-full border border-emerald-300/25 bg-emerald-400/10 px-5 py-2.5 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/15"
            >
              Compare 
            </Link>

            <Link
              href="/compare"
              className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              Compare Center
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Top 10 Teams
            </h2>
          </div>

          <Link
            href="/rankings"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Full rankings
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {topTeams.map(({ ranking, team }) => {
            const styles = getTopTeamCardStyles(ranking.rank);

            return (
              <Link
                key={ranking.entity_id}
                href={`/teams/${team!.slug}`}
                className={`group relative overflow-hidden rounded-[1.6rem] border p-5 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 ${styles.card}`}
              >
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_42%)] opacity-0 transition group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/5" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <TeamLogo
                      name={team!.name}
                      logoUrl={team!.logo_url}
                      size="lg"
                    />

                    <div
                      className={`rounded-full border px-3 py-1 text-sm font-black ${styles.badge}`}
                    >
                      #{ranking.rank}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-black tracking-tight text-white">
                      {team!.name}
                    </h3>

                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
                      {team!.short_name || "TEAM"}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs text-white/35">Points</p>
                      <p className={`text-xl font-black ${styles.accent}`}>
                        {ranking.score}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-white/35">WWCD</p>
                      <p className="text-xl font-black text-white">
                        {team!.wins ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/35">Kills</p>
                      <p className="text-sm font-semibold text-white/80">
                        {team!.kills ?? 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-white/35">Matches</p>
                      <p className="text-sm font-semibold text-white/80">
                        {team!.matches_played ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="flex flex-col gap-5 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              All Teams
            </h2>
          </div>
        </div>
        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">WWCD</th>
                <th className="px-6 py-4 text-right">Matches</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {tableTeams.map(({ ranking, team }) => (
                <tr
                  key={ranking.entity_id}
                  className={`border-b border-white/[0.06] transition ${getTableRowStyles(
                    ranking.rank
                  )}`}
                >
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyles(
                        ranking.rank
                      )}`}
                    >
                      #{ranking.rank}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <TeamLogo
                        name={team!.name}
                        logoUrl={team!.logo_url}
                        size="sm"
                      />

                      <div>
                        <Link
                          href={`/teams/${team!.slug}`}
                          className="font-bold text-white hover:underline"
                        >
                          {team!.name}
                        </Link>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                          {team!.short_name || "TEAM"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {team!.active !== false ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/35">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-5 text-right font-black text-white">
                    {ranking.score}
                  </td>

                  <td className="px-6 py-5 text-right text-white/65">
                    {team!.wins ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {team!.matches_played ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {team!.kills ?? 0}
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45">
                      Krafton
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 p-6">
          <Link
            href={`/teams?page=${previousPage}`}
            className={`rounded-full border px-5 py-2 text-sm transition ${
              hasPrevious
                ? "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white"
                : "pointer-events-none border-white/5 text-white/20"
            }`}
          >
            Previous
          </Link>

          <p className="text-sm text-white/35">
            Page {currentPage} of {totalPages}
          </p>

          <Link
            href={`/teams?page=${nextPage}`}
            className={`rounded-full border px-5 py-2 text-sm transition ${
              hasNext
                ? "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white"
                : "pointer-events-none border-white/5 text-white/20"
            }`}
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}