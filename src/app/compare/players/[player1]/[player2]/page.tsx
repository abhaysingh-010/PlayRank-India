import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Radar, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
type Team = { name: string; slug: string };
type RawPlayer = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  country: string | null;
  total_kills: number | null;
  avg_damage: number | null;
  kd_ratio: number | null;
  win_rate: number | null;
  mvp_count: number | null;
  matches_played: number | null;
  verified: boolean | null;
  team: Team | Team[] | null;
};
type Player = Omit<RawPlayer, "team"> & { team: Team | null };
type Ranking = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};
type Stat = {
  kills: number | null;
  damage: number | null;
  assists: number | null;
  knocks: number | null;
  is_mvp: boolean | null;
  mvp: boolean | null;
};
function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value;
}
function num(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export default async function PlayerCompareDynamicPage({
  params,
}: {
  params: Promise<{ player1: string; player2: string }>;
}) {
  const { player1, player2 } = await params;
  const select =
    "id,ign,slug,role,country,total_kills,avg_damage,kd_ratio,win_rate,mvp_count,matches_played,verified,team:team_id(name,slug)";
  const [aResult, bResult] = await Promise.all([
    supabase.from("players").select(select).eq("slug", player1).maybeSingle(),
    supabase.from("players").select(select).eq("slug", player2).maybeSingle(),
  ]);
  const rawA = aResult.data as RawPlayer | null,
    rawB = bResult.data as RawPlayer | null;
  if (!rawA || !rawB) notFound();
  const a = { ...rawA, team: one(rawA.team) } as Player,
    b = { ...rawB, team: one(rawB.team) } as Player;
  const [rankingResult, statsAResult, statsBResult] = await Promise.all([
    supabase
      .from("rankings")
      .select("entity_id,rank,score,change")
      .eq("entity_type", "player")
      .in("entity_id", [a.id, b.id]),
    supabase
      .from("player_match_stats")
      .select("kills,damage,assists,knocks,is_mvp,mvp")
      .eq("player_id", a.id)
      .limit(20),
    supabase
      .from("player_match_stats")
      .select("kills,damage,assists,knocks,is_mvp,mvp")
      .eq("player_id", b.id)
      .limit(20),
  ]);
  const rankings = (rankingResult.data || []) as Ranking[],
    ra = rankings.find((row) => row.entity_id === a.id),
    rb = rankings.find((row) => row.entity_id === b.id),
    statsA = (statsAResult.data || []) as Stat[],
    statsB = (statsBResult.data || []) as Stat[];
  const sum = (rows: Stat[], key: "kills" | "damage" | "assists" | "knocks") =>
    rows.reduce((total, row) => total + num(row[key]), 0);
  const metrics = [
    { label: "Ranking score", a: num(ra?.score), b: num(rb?.score) },
    {
      label: "Total kills",
      a: num(a.total_kills) || sum(statsA, "kills"),
      b: num(b.total_kills) || sum(statsB, "kills"),
    },
    {
      label: "Average damage",
      a:
        num(a.avg_damage) ||
        (statsA.length ? sum(statsA, "damage") / statsA.length : 0),
      b:
        num(b.avg_damage) ||
        (statsB.length ? sum(statsB, "damage") / statsB.length : 0),
    },
    { label: "KD ratio", a: num(a.kd_ratio), b: num(b.kd_ratio) },
    { label: "Win rate", a: num(a.win_rate), b: num(b.win_rate) },
    {
      label: "MVP records",
      a:
        num(a.mvp_count) ||
        statsA.filter((row) => row.is_mvp || row.mvp).length,
      b:
        num(b.mvp_count) ||
        statsB.filter((row) => row.is_mvp || row.mvp).length,
    },
  ];
  const pointsA = metrics.reduce(
      (sum, row) => sum + (row.a > row.b ? 1 : 0),
      0,
    ),
    pointsB = metrics.reduce((sum, row) => sum + (row.b > row.a ? 1 : 0), 0),
    leader = pointsA === pointsB ? null : pointsA > pointsB ? a : b;
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-12 md:py-18">
          <Link
            href="/players/compare"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35"
          >
            <ArrowLeft size={13} /> New comparison
          </Link>
          <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-end gap-5">
            <Identity player={a} rank={ra?.rank || null} />
            <div className="pb-3 text-center">
              <Radar size={20} className="mx-auto text-[var(--pr-red)]" />
              <p className="mt-3 text-[9px] uppercase tracking-[.18em] text-white/25">
                Player versus
              </p>
            </div>
            <Identity player={b} rank={rb?.rank || null} right />
          </div>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          <Score value={pointsA} label={a.ign} />
          <Score value={leader?.ign || "Draw"} label="Metric verdict" accent />
          <Score value={pointsB} label={b.ign} />
        </div>
      </section>
      <section className="pr-container grid gap-12 py-16 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="pr-kicker">Metric breakdown</p>
          <div className="mt-6 border-t border-white/15">
            {metrics.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_140px_1fr] items-center border-b border-white/10 py-5"
              >
                <p
                  className={`text-xl font-semibold ${row.a > row.b ? "text-[var(--pr-gold)]" : "text-white/50"}`}
                >
                  {Number.isInteger(row.a) ? row.a : row.a.toFixed(1)}
                </p>
                <p className="text-center text-[9px] font-bold uppercase tracking-[.14em] text-white/25">
                  {row.label}
                </p>
                <p
                  className={`text-right text-xl font-semibold ${row.b > row.a ? "text-[var(--pr-gold)]" : "text-white/50"}`}
                >
                  {Number.isInteger(row.b) ? row.b : row.b.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <h2 className="mt-5 text-3xl font-semibold tracking-[-.04em]">
            Comparison context.
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/45">
            Verdict counts advantages across {metrics.length} available metrics.
            Recent stat coverage includes {statsA.length} records for {a.ign}{" "}
            and {statsB.length} for {b.ign}. Different sample sizes reduce
            certainty.
          </p>
          <p className="mt-6 text-xs uppercase tracking-[.15em] text-white/25">
            Coverage:{" "}
            {a.verified && b.verified
              ? "Both players verified"
              : "Mixed verification"}
          </p>
        </div>
      </section>
    </main>
  );
}
function Identity({
  player,
  rank,
  right = false,
}: {
  player: Player;
  rank: number | null;
  right?: boolean;
}) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className={`${right ? "text-right" : ""}`}
    >
      <div className={`flex ${right ? "justify-end" : ""}`}>
        <div className="flex h-20 w-20 items-center justify-center border border-white/15 text-lg font-black text-white/55">
          {initials(player.ign)}
        </div>
      </div>
      <h1 className="mt-5 text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[.9] tracking-[-.06em]">
        {player.ign}
      </h1>
      <p className="mt-3 text-[9px] uppercase tracking-[.15em] text-white/25">
        {rank ? `Rank #${rank}` : "Unranked"} · {player.role || "Player"}
      </p>
    </Link>
  );
}
function Score({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="border-r border-white/15 px-4 py-7 first:border-l text-center">
      <p
        className={`truncate text-2xl font-semibold ${accent ? "text-[var(--pr-gold)]" : ""}`}
      >
        {value}
      </p>
      <p className="mt-2 truncate text-[9px] uppercase tracking-[.14em] text-white/25">
        {label}
      </p>
    </div>
  );
}
