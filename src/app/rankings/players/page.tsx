import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";
import DataFreshnessBadge from "@/components/DataFreshnessBadge";
import RankingExplanationPanel from "@/components/RankingExplanationPanel";

type RankingRow = {
  id: string;
  entity_id: string;
  entity_type: "player";
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  country: string | null;
  role: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  recent_form: number | string | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

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

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
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

function formatChange(value: number | null) {
  if (!value) return "â€”";
  if (value > 0) return `+${value}`;

  return String(value);
}

function changeTone(value: number | null) {
  if (!value) return "text-white/35";
  if (value > 0) return "text-emerald-300";

  return "text-red-300";
}

function rankPill(rank: number) {
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

  return "border-white/10 bg-white/[0.035] text-white/75";
}

function PlayerAvatar({ ign }: { ign: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/70">
      {getInitials(ign)}
    </div>
  );
}

export default async function PlayerRankingsPage() {
  const [rankingsResult, latestSnapshotResult, playerCountResult] =
    await Promise.all([
      supabase
        .from("rankings")
        .select("id, entity_id, entity_type, rank, score, change, updated_at")
        .eq("entity_type", "player")
        .order("rank", { ascending: true })
        .range(0, 49),

      supabase
        .from("ranking_history")
        .select("snapshot_date, created_at")
        .eq("entity_type", "player")
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase.from("players").select("*", { count: "exact", head: true }),
    ]);

  const rankings = (rankingsResult.data || []) as RankingRow[];
  const playerIds = rankings.map((row) => row.entity_id);
  const { data: playersRaw, error: playersError } = playerIds.length > 0 ? await supabase
  .from("players")
  .select
  (
    "id, ign, slug, country, role, kd_ratio, avg_damage, win_rate, matches_played, total_kills, mvp_count, recent_form, source, verified, active"
  )
  .in("id", playerIds) : { data: [], error: null };
  if (rankingsResult.error || playersError) 
    {
      return (
        <main className="page-shell py-10 text-white">
          <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
            <h1 className="text-2xl font-black">Player Rankings</h1>
            <p className="mt-3 text-red-300">
              Failed to load player rankings. Check Supabase permissions and table
              columns.
            </p>
          </section>
        </main>
      );
    }
  const players = (playersRaw || []) as PlayerRow[];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const rankedPlayers = rankings
  .map
  (
    (ranking) => 
    (
      {
        ranking,
        player: playerById.get(ranking.entity_id),
      }
    )
  )
  .filter((item): item is { ranking: RankingRow; player: PlayerRow } => Boolean(item.player));

  const latestSnapshot = latestSnapshotResult.data?.snapshot_date || latestSnapshotResult.data?.created_at || null;
  const latestRankingUpdate = getLatestDate(rankings.map((row) => row.updated_at)) || latestSnapshot;

  return (
    <main className="page-shell space-y-8 py-8 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-[#07080c] p-7 md:p-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="PlayRank Player Ranking" />
              <DataSourceBadge label="Analytics Generated" />
              <DataSourceBadge label="Directional Confidence" />
            </div>

            <p className="krafton-label mt-6">Player Rankings</p>

            <h1 className="mt-4 text-6xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-8xl">
              Player
              <br />
              Rankings
            </h1>

            <p className="mt-5 max-w-3xl text-white/50">
              Current PlayRank player order generated from available player,
              match, seed and performance data. Player rankings should be read
              as directional until match sample size becomes stronger.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/rankings" className="btn-primary px-5 py-3 text-sm">
                All Rankings
              </Link>
              <Link
                href="/rankings/teams"
                className="btn-secondary px-5 py-3 text-sm"
              >
                Team Rankings
              </Link>
              <Link href="/data" className="btn-secondary px-5 py-3 text-sm">
                Data Trust
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="data-label">Last Updated</p>
              <p className="mt-2 text-xl font-black">
                {formatDate(latestRankingUpdate)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="data-label">Ranked Players</p>
              <p className="mt-2 text-xl font-black">
                {rankedPlayers.length.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="data-label">Player Database</p>
              <p className="mt-2 text-xl font-black">
                {n(playerCountResult.count).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] p-4">
              <p className="data-label">Confidence</p>
              <p className="mt-2 text-xl font-black text-yellow-300">
                Directional
              </p>
            </div>
          </div>
        </div>
      </section>

      <RankingExplanationPanel variant="player" lastUpdatedLabel={formatDate(latestRankingUpdate)} />

      <section className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-6">
        <div className="flex flex-wrap gap-2">
          <DataSourceBadge label="Independent Platform" />
          <DataSourceBadge label="Analytics Generated" />
          <DataSourceBadge label="No Predictions" />
        </div>

        <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em]">
          Player rankings are directional intelligence
        </h2>

        <p className="mt-3 max-w-5xl text-sm leading-7 text-white/55">
          PlayRank is an independent esports intelligence platform. Player
          rankings are independently calculated from available source, roster,
          match and player performance data. They are not official predictions,
          betting tips or outcome guarantees.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataFreshnessBadge value={latestRankingUpdate} label="Player Freshness" />
              <DataSourceBadge label="Sample Size Aware" />
              <DataSourceBadge label="PlayRank Calculated" />
            </div>

            <h2 className="mt-4 text-2xl font-black">Player Ranking Table</h2>
            <p className="mt-2 text-sm text-white/45">
              Ordered by current rank. Treat early ranking signals as
              directional until player match sample size grows.
            </p>
          </div>

          <Link
            href="/players"
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Explore players
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Score</th>
                <th className="px-6 py-4 text-right">Change</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">Damage</th>
                <th className="px-6 py-4 text-right">MVP</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>

            <tbody>
              {rankedPlayers.length > 0 ? (
                rankedPlayers.map(({ ranking, player }) => (
                  <tr
                    key={ranking.id}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-black ${rankPill(
                          ranking.rank
                        )}`}
                      >
                        #{ranking.rank}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <PlayerAvatar ign={player.ign} />
                        <div>
                          <Link
                            href={`/players/${player.slug}`}
                            className="font-bold text-white hover:underline"
                          >
                            {player.ign}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                            Player
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-white/55">
                      {player.country || "India"}
                    </td>

                    <td className="px-6 py-5 text-white/55">
                      {player.role || "â€”"}
                    </td>

                    <td className="px-6 py-5 text-right font-black">
                      {ranking.score}
                    </td>

                    <td
                      className={`px-6 py-5 text-right font-black ${changeTone(
                        ranking.change
                      )}`}
                    >
                      {formatChange(ranking.change)}
                    </td>

                    <td className="px-6 py-5 text-right text-white/60">
                      {player.total_kills ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {player.avg_damage ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {player.mvp_count ?? 0}
                    </td>

                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={player.source}
                        verified={player.verified}
                        label={player.verified ? "Verified Player" : "PlayRank"}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-white/45">
                    No player rankings available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}


