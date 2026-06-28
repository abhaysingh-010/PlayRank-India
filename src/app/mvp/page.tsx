import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

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
  team_id: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
};

type MvpLeaderboardRow = RankingRow & {
  player: PlayerRow | null;
  team: TeamRow | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getChangeLabel(change: number) {
  if (change > 0) return `UP ${change}`;
  if (change < 0) return `DOWN ${Math.abs(change)}`;
  return "STABLE";
}

function getChangeTone(change: number) {
  if (change > 0) return "text-emerald-300";
  if (change < 0) return "text-red-300";
  return "text-white/35";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PlayerCard({
  item,
  index,
}: {
  item: MvpLeaderboardRow;
  index: number;
}) {
  const playerName = item.player?.ign || "Unknown Player";
  const href = item.player?.slug ? `/players/${item.player.slug}` : "/players";
  const change = n(item.change);
  const teamName =
    item.team?.name ||
    item.team?.short_name ||
    item.player?.role ||
    "No team linked";

  return (
    <Link
      href={href}
      className="group block rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#ffd21a]/25 hover:bg-white/[0.055] md:p-8"
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-[#ffd21a]/20 bg-[#ffd21a]/10">
            <h2 className="text-3xl font-black text-[#ffd21a]">
              #{index + 1}
            </h2>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
                {playerName}
              </h2>

              <DataSourceBadge
                source={item.player?.source}
                verified={item.player?.verified}
                label={item.player?.verified ? "Verified Player" : "MVP Signal"}
              />
            </div>

            <p className="mt-2 text-sm text-white/45">{teamName}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                {item.player?.role || "Player"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                {item.player?.country || "India"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                {getInitials(playerName)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="min-w-[130px] rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Score
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {n(item.score).toLocaleString("en-IN")}
            </h3>
          </div>

          <div className="min-w-[130px] rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Rank
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              #{item.rank}
            </h3>
          </div>

          <div className="min-w-[130px] rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Change
            </p>
            <h3 className={`mt-2 text-xl font-black ${getChangeTone(change)}`}>
              {getChangeLabel(change)}
            </h3>
          </div>

          <div className="min-w-[130px] rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              MVPs
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">
              {n(item.player?.mvp_count)}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function MVPPage() {
  const { data: rankingsRaw, error: rankingsError } = await supabase
    .from("rankings")
    .select("id, entity_id, entity_type, rank, score, change, updated_at")
    .eq("entity_type", "player")
    .order("score", { ascending: false })
    .limit(50);

  const rankings = (rankingsRaw || []) as RankingRow[];
  const playerIds = rankings.map((ranking) => ranking.entity_id);

  const { data: playersRaw } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select(
            "id, ign, slug, country, role, team_id, kd_ratio, avg_damage, win_rate, matches_played, total_kills, mvp_count, source, verified, active"
          )
          .in("id", playerIds)
      : { data: [] };

  const players = (playersRaw || []) as PlayerRow[];
  const teamIds = Array.from(
    new Set(players.map((player) => player.team_id).filter(Boolean))
  ) as string[];

  const { data: teamsRaw } =
    teamIds.length > 0
      ? await supabase
          .from("teams")
          .select("id, name, short_name, slug")
          .in("id", teamIds)
      : { data: [] };

  const teams = (teamsRaw || []) as TeamRow[];

  const playerById = new Map(players.map((player) => [player.id, player]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const leaderboard: MvpLeaderboardRow[] = rankings.map((ranking) => {
    const player = playerById.get(ranking.entity_id) || null;
    const team = player?.team_id ? teamById.get(player.team_id) || null : null;

    return {
      ...ranking,
      player,
      team,
    };
  });

  return (
    <main className="min-h-screen bg-[#030406] px-5 py-12 text-white md:px-8 md:py-16">
      <section className="mx-auto max-w-7xl">
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="Elite Performance" size="md" />
            <DataSourceBadge label="MVP Signal" size="md" />
            <DataSourceBadge label="RLS Protected" size="md" />
          </div>

          <h1 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
            MVP
            <br />
            Leaderboard
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50 md:text-base">
            Discover the highest-performing players by PlayRank score. MVP
            placement is a directional analytics signal based on available
            ranking, roster and player performance data.
          </p>
        </div>

        {rankingsError ? (
          <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8">
            <p className="text-lg font-black text-red-300">
              MVP leaderboard unavailable
            </p>
            <p className="mt-2 text-sm text-white/55">
              {rankingsError.message}
            </p>
          </div>
        ) : null}

        {!rankingsError && leaderboard.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-lg font-black text-white">
              No MVP ranking rows found.
            </p>
            <p className="mt-2 text-sm text-white/45">
              Add player ranking rows or run ranking sync from the protected
              admin console.
            </p>
          </div>
        ) : null}

        {!rankingsError && leaderboard.length > 0 ? (
          <div className="space-y-5">
            {leaderboard.map((item, index) => (
              <PlayerCard
                key={`${item.entity_type}-${item.entity_id}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}