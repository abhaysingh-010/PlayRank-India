import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PlayerCompareSelector from "@/components/PlayerCompareSelector";

type PlayerOption = {
  id: string;
  ign: string;
  slug: string;
  real_name: string | null;
  role: string | null;
  country: string | null;
  team_id: string | null;
  team_name?: string | null;
  team_slug?: string | null;
  matches_played: number | null;
  total_kills: number | null;
  avg_kills: number | null;
  avg_damage: number | null;
  kd_ratio: number | null;
  win_rate: number | null;
  mvp_count: number | null;
  assists: number | null;
  revives: number | null;
  knocks: number | null;
  recent_form: string | null;
};

type RankingRow = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};

const surface =
  "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel =
  "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function shortNumber(value: number | null | undefined) {
  const safeValue = Number(value || 0);

  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(1)}k`;
  }

  return Math.round(safeValue).toString();
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
  role?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-emerald-400/[0.18] via-white/[0.05] to-blue-400/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
    >
      <div className="text-center">
        <p className="text-sm font-black text-white">{getInitials(ign)}</p>
        {size !== "sm" ? (
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">
            {role || "Player"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function rankTone(rank: number | null | undefined) {
  if (!rank) return "border-white/10 bg-white/[0.04] text-white/60";
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  return "border-white/10 bg-white/[0.04] text-white/70";
}

function Mini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[1.05rem] border border-white/[0.10] bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-lg font-black ${
          highlight
            ? "bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PlayerPreviewCard({
  player,
  rank,
  score,
}: {
  player: PlayerOption;
  rank?: number | null;
  score?: number | null;
}) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="group relative block overflow-hidden rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.055]"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10 flex items-center gap-3">
        <PlayerAvatar ign={player.ign} role={player.role} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${rankTone(
                rank
              )}`}
            >
              {rank ? `#${rank}` : "—"}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/55">
              {player.role || "Player"}
            </span>
          </div>

          <p className="mt-2 truncate text-sm font-black text-white">
            {player.ign}
          </p>

          <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-white/35">
            {player.team_name || player.real_name || "PlayRank"}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
        <Mini label="Score" value={shortNumber(score || 0)} highlight />
        <Mini label="Kills" value={shortNumber(player.total_kills)} />
        <Mini label="MVP" value={n(player.mvp_count)} />
      </div>
    </Link>
  );
}

function SuggestedDuel({
  firstPlayer,
  secondPlayer,
  firstRank,
  secondRank,
  firstScore,
  secondScore,
  label,
}: {
  firstPlayer: PlayerOption;
  secondPlayer: PlayerOption;
  firstRank?: number | null;
  secondRank?: number | null;
  firstScore?: number | null;
  secondScore?: number | null;
  label: string;
}) {
  return (
    <Link
      href={`/compare/players/${firstPlayer.slug}/${secondPlayer.slug}`}
      className="group relative block overflow-hidden rounded-[1.5rem] border border-white/[0.10] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-white/[0.055]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300/70">
          {label}
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <PlayerAvatar
                ign={firstPlayer.ign}
                role={firstPlayer.role}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {firstPlayer.ign}
                </p>
                <p className="text-xs text-white/35">
                  #{firstRank || "—"} · {shortNumber(firstScore || 0)} score
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/35">
            VS
          </span>

          <div className="min-w-0 text-right">
            <div className="flex flex-row-reverse items-center gap-3">
              <PlayerAvatar
                ign={secondPlayer.ign}
                role={secondPlayer.role}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {secondPlayer.ign}
                </p>
                <p className="text-xs text-white/35">
                  #{secondRank || "—"} · {shortNumber(secondScore || 0)} score
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-sm text-white/45">Open player duel analysis</p>
          <span className="text-sm font-black text-blue-300 transition group-hover:translate-x-1">
            Compare →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function ComparePlayersPage({
  searchParams,
}: {
  searchParams: Promise<{
    player1?: string;
    player2?: string;
  }>;
}) {
  const params = await searchParams;

  if (params?.player1 && params?.player2 && params.player1 !== params.player2) {
    redirect(`/compare/players/${params.player1}/${params.player2}`);
  }

  const { data: playerData } = await supabase
    .from("player_analytics")
    .select("*")
    .not("slug", "is", null)
    .order("ign", { ascending: true });

  const players = (playerData || []) as PlayerOption[];

  if (players.length < 2) {
    return (
      <main className="page-shell relative py-6 text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

        <section className={surface}>
          <div className="relative z-10 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/35">
              Player Compare
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
              Not enough player data
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
              At least two players are required to open the Player Duel Analyzer.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const playerIds = players.map((player) => player.id);

  const { data: rankingData } = await supabase
    .from("rankings")
    .select("entity_id, rank, score, change")
    .eq("entity_type", "player")
    .in("entity_id", playerIds);

  const rankings = (rankingData || []) as RankingRow[];

  const getRank = (playerId: string) =>
    rankings.find((ranking) => ranking.entity_id === playerId);

  const rankedPlayers = [...players].sort((a, b) => {
    const rankA = getRank(a.id)?.rank ?? 9999;
    const rankB = getRank(b.id)?.rank ?? 9999;

    if (rankA !== rankB) return rankA - rankB;

    return n(b.total_kills) - n(a.total_kills);
  });

  const topPlayers = rankedPlayers.slice(0, 8);

  const sameRolePair = (() => {
    for (const playerA of rankedPlayers) {
      const match = rankedPlayers.find(
        (playerB) =>
          playerB.id !== playerA.id &&
          playerA.role &&
          playerB.role &&
          playerA.role === playerB.role
      );

      if (match) return { firstPlayer: playerA, secondPlayer: match };
    }

    return {
      firstPlayer: rankedPlayers[0],
      secondPlayer: rankedPlayers[1],
    };
  })();

  const suggestedPairs = [
    {
      label: "Top-ranked duel",
      firstPlayer: rankedPlayers[0],
      secondPlayer: rankedPlayers[1],
    },
    {
      label: "Fragging test",
      firstPlayer: [...players].sort(
        (a, b) => n(b.total_kills) - n(a.total_kills)
      )[0],
      secondPlayer: [...players].sort(
        (a, b) => n(b.total_kills) - n(a.total_kills)
      )[1],
    },
    {
      label: "Damage duel",
      firstPlayer: [...players].sort(
        (a, b) => n(b.avg_damage) - n(a.avg_damage)
      )[0],
      secondPlayer: [...players].sort(
        (a, b) => n(b.avg_damage) - n(a.avg_damage)
      )[1],
    },
    {
      label: "Role rivalry",
      firstPlayer: sameRolePair.firstPlayer,
      secondPlayer: sameRolePair.secondPlayer,
    },
  ].filter(
    (pair) =>
      pair.firstPlayer &&
      pair.secondPlayer &&
      pair.firstPlayer.id !== pair.secondPlayer.id
  );

  const selectorPlayers = players.map((player) => ({
    id: player.id,
    ign: player.ign,
    slug: player.slug,
    role: player.role,
  }));

  return (
    <main className="page-shell relative space-y-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/35">
              PlayRank Player Intelligence
            </p>

            <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
              Player Duel Analyzer
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/48 md:text-base">
              Select any two players and compare fragging, damage output, entry
              pressure, clutch value, support contribution and current form.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:min-w-[360px]">
            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Players
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {players.length}
              </p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Ranked
              </p>
              <p className="mt-2 text-3xl font-black text-blue-300">
                {rankings.length}
              </p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Radar
              </p>
              <p className="mt-2 text-3xl font-black text-white">ON</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.10),transparent_34%)]" />

          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Select Players
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Build a Player Duel
            </h2>
          </div>

          <div className="relative z-10 p-5">
            <PlayerCompareSelector players={selectorPlayers} />
          </div>
        </section>

        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.10),transparent_34%)]" />

          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Player Pool
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Top Duel Candidates
            </h2>
          </div>

          <div className="relative z-10 grid gap-3 p-5 sm:grid-cols-2">
            {topPlayers.map((player) => {
              const ranking = getRank(player.id);

              return (
                <PlayerPreviewCard
                  key={player.id}
                  player={player}
                  rank={ranking?.rank ?? null}
                  score={ranking?.score ?? 0}
                />
              );
            })}
          </div>
        </section>
      </section>

      <section className={surface}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.10),transparent_34%)]" />

        <div className="relative z-10 flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Suggested Duels
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Quick Matchups
            </h2>
          </div>

          <p className="text-sm text-white/40">
            Fast entry into premium player comparison.
          </p>
        </div>

        <div className="relative z-10 grid gap-4 p-5 lg:grid-cols-2">
          {suggestedPairs.map((pair) => {
            const firstRanking = getRank(pair.firstPlayer.id);
            const secondRanking = getRank(pair.secondPlayer.id);

            return (
              <SuggestedDuel
                key={`${pair.label}-${pair.firstPlayer.id}-${pair.secondPlayer.id}`}
                label={pair.label}
                firstPlayer={pair.firstPlayer}
                secondPlayer={pair.secondPlayer}
                firstRank={firstRanking?.rank ?? null}
                secondRank={secondRanking?.rank ?? null}
                firstScore={firstRanking?.score ?? 0}
                secondScore={secondRanking?.score ?? 0}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}