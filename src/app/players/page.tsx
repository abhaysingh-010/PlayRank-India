import Link from "next/link";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};

type PlayerRow = {
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
  recent_form: string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
  team: {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
  } | null;
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

function PlayerAvatar({
  ign,
  role,
  size = "md",
}: {
  ign: string;
  role: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
    >
      <div className="text-center">
        <span className="block text-sm font-black tracking-tight text-white/70">
          {getInitials(ign)}
        </span>

        {size === "lg" ? (
          <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.16em] text-white/30">
            {role || "Player"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getTopPlayerCardStyles(rank: number) {
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

export default async function PlayersPage({
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
    .eq("entity_type", "player")
    .order("rank", { ascending: true })
    .range(0, 9);

  const {
    data: pageRankingsRaw,
    error: pageRankingsError,
    count,
  } = await supabase
    .from("rankings")
    .select("entity_id, rank, score, change", { count: "exact" })
    .eq("entity_type", "player")
    .order("rank", { ascending: true })
    .range(from, to);

  const topRankings = (topRankingsRaw || []) as RankingRow[];
  const pageRankings = (pageRankingsRaw || []) as RankingRow[];

  const allPlayerIds = Array.from(
    new Set([
      ...topRankings.map((row) => row.entity_id),
      ...pageRankings.map((row) => row.entity_id),
    ])
  );

  const playersResult =
    allPlayerIds.length > 0
      ? await supabase
          .from("players")
          .select(
            `
            id,
            ign,
            real_name,
            slug,
            team_id,
            role,
            country,
            kd_ratio,
            avg_damage,
            win_rate,
            matches_played,
            total_kills,
            mvp_count,
            recent_form,
            source,
            verified,
            active,
            team:team_id (
              id,
              name,
              slug,
              short_name
            )
          `
          )
          .in("id", allPlayerIds)
      : { data: [], error: null };

  const playersRaw = playersResult.data;
  const playersError = playersResult.error;

  const players = (playersRaw || []).map((p: any) => ({
    ...p,
    team: Array.isArray(p.team) ? p.team[0] || null : p.team,
  })) as PlayerRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));

  const topPlayers = topRankings
    .map((ranking) => ({
      ranking,
      player: playerById.get(ranking.entity_id),
    }))
    .filter((item) => item.player);

  const tablePlayers = pageRankings
    .map((ranking) => ({
      ranking,
      player: playerById.get(ranking.entity_id),
    }))
    .filter((item) => item.player);

  const totalRows = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (topRankingsError || pageRankingsError || playersError) {
    return (
      <main className="page-shell">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <p className="mt-3 text-red-300">
            Failed to load players. Check Supabase query, table permissions, or
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
              Player Rankings
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <p className="text-xs text-white/40">Players</p>
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
              <p className="mt-1 text-sm font-bold text-white">PLR</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Link
              href="/players/compare"
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
              Top 10 Players
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
          {topPlayers.map(({ ranking, player }) => {
            const styles = getTopPlayerCardStyles(ranking.rank);

            return (
              <Link
                key={ranking.entity_id}
                href={`/players/${player!.slug}`}
                className={`group relative overflow-hidden rounded-[1.6rem] border p-5 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 ${styles.card}`}
              >
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
                />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_42%)] opacity-0 transition group-hover:opacity-100" />

                <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/5" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <PlayerAvatar
                      ign={player!.ign}
                      role={player!.role}
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
                      {player!.ign}
                    </h3>

                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
                      {player!.role || "PLAYER"}
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
                      <p className="text-xs text-white/35">Kills</p>
                      <p className="text-xl font-black text-white">
                        {player!.total_kills ?? 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/35">MVP</p>
                      <p className="text-sm font-semibold text-white/80">
                        {player!.mvp_count ?? 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-white/35">Matches</p>
                      <p className="text-sm font-semibold text-white/80">
                        {player!.matches_played ?? 0}
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
              All Players
            </h2>
          </div>
        </div>

        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">Matches</th>
                <th className="px-6 py-4 text-right">MVP</th>
                <th className="px-6 py-4">Team</th>
              </tr>
            </thead>

            <tbody>
              {tablePlayers.map(({ ranking, player }) => (
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
                      <PlayerAvatar
                        ign={player!.ign}
                        role={player!.role}
                        size="sm"
                      />

                      <div>
                        <Link
                          href={`/players/${player!.slug}`}
                          className="font-bold text-white hover:underline"
                        >
                          {player!.ign}
                        </Link>

                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                          {player!.real_name || "PLAYER"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45">
                      {player!.role || "Player"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right font-black text-white">
                    {ranking.score}
                  </td>

                  <td className="px-6 py-5 text-right text-white/65">
                    {player!.total_kills ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {player!.matches_played ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {player!.mvp_count ?? 0}
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45">
                      {player!.team?.short_name ||
                        player!.team?.name ||
                        "Free Agent"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 p-6">
          <Link
            href={`/players?page=${previousPage}`}
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
            href={`/players?page=${nextPage}`}
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