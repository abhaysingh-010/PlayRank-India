import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Radar,
  ShieldCheck,
} from "lucide-react";
import RankHistoryChart from "@/components/RankHistoryChart";
import { Reveal } from "@/components/home/HomeMotion";
import { supabase } from "@/lib/supabase";

type Team = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  global_rank: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};
type Player = {
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
  recent_form: string | number | null;
  assists: number | null;
  revives: number | null;
  knocks: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
  team: Team | null;
};
type PlayerQuery = Omit<Player, "team"> & { team: Team | Team[] | null };
type Stat = {
  id: string | number;
  match_id: string | null;
  kills: number | null;
  damage: number | null;
  placement: number | null;
  assists: number | null;
  revives: number | null;
  knocks: number | null;
  is_mvp: boolean | null;
  mvp: boolean | null;
};
type History = {
  id: string;
  entity_type: string;
  entity_id: string;
  rank: number;
  score: number;
  snapshot_date: string;
  created_at: string | null;
};
type Ranking = {
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};
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
function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not available";
}
function sourceLabel(source?: string | null) {
  if (source === "krafton_india_esports") return "Official Krafton";
  if (source === "pubg_api") return "PUBG API";
  if (source === "admin_manual") return "Admin verified";
  return source || "PlayRank";
}
function movement(value?: number | null) {
  if (!value) return "Stable";
  return value > 0 ? `Up ${value}` : `Down ${Math.abs(value)}`;
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: rawPlayer, error } = await supabase
    .from("players")
    .select(
      "*,team:team_id(id,name,slug,short_name,global_rank,source,verified,active)",
    )
    .eq("slug", slug)
    .single();
  if (error || !rawPlayer)
    return (
      <main className="pr-container py-20">
        <p className="pr-kicker">404</p>
        <h1 className="mt-4 text-5xl font-semibold text-white">
          Player not found.
        </h1>
        <Link
          href="/players"
          className="mt-8 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"
        >
          <ArrowLeft size={15} /> Back to players
        </Link>
      </main>
    );
  const query = rawPlayer as PlayerQuery;
  const player = {
    ...query,
    team: Array.isArray(query.team) ? query.team[0] || null : query.team,
  } as Player;
  const [rankingResult, statsResult, recentResult, historyResult] =
    await Promise.all([
      supabase
        .from("rankings")
        .select("rank,score,change,updated_at")
        .eq("entity_type", "player")
        .eq("entity_id", player.id)
        .maybeSingle(),
      supabase
        .from("player_match_stats")
        .select(
          "id,match_id,kills,damage,placement,assists,revives,knocks,is_mvp,mvp",
        )
        .eq("player_id", player.id),
      supabase
        .from("player_match_stats")
        .select(
          "id,match_id,kills,damage,placement,assists,revives,knocks,is_mvp,mvp",
        )
        .eq("player_id", player.id)
        .order("id", { ascending: false })
        .limit(5),
      supabase
        .from("ranking_history")
        .select("*")
        .eq("entity_type", "player")
        .eq("entity_id", player.id)
        .order("snapshot_date", { ascending: true }),
    ]);
  const ranking = rankingResult.data as Ranking | null,
    stats = (statsResult.data || []) as Stat[],
    recent = (recentResult.data || []) as Stat[],
    history = (historyResult.data || []) as History[];
  const matches = stats.length || num(player.matches_played),
    kills =
      stats.reduce((sum, row) => sum + num(row.kills), 0) ||
      num(player.total_kills),
    damage =
      stats.reduce((sum, row) => sum + num(row.damage), 0) ||
      num(player.avg_damage) * matches;
  const assists =
      stats.reduce((sum, row) => sum + num(row.assists), 0) ||
      num(player.assists),
    knocks =
      stats.reduce((sum, row) => sum + num(row.knocks), 0) ||
      num(player.knocks),
    mvps =
      stats.filter((row) => row.is_mvp || row.mvp).length ||
      num(player.mvp_count);
  const avgKills = matches ? kills / matches : 0,
    avgDamage = matches ? damage / matches : num(player.avg_damage),
    rank = ranking?.rank || history.at(-1)?.rank || 0;
  const impact = Math.round(
    kills * 0.35 + avgDamage * 0.2 + mvps * 8 + assists * 0.1 + knocks * 0.15,
  );
  const archetype =
    avgDamage >= 500
      ? "High-pressure fragger"
      : assists >= 20
        ? "Support anchor"
        : mvps >= 3
          ? "Clutch specialist"
          : avgKills >= 3
            ? "Consistent eliminator"
            : "Developing competitor";

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-12 md:py-18">
          <Link
            href="/players"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 hover:text-white"
          >
            <ArrowLeft size={13} /> Player directory
          </Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-end">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center border border-white/15 bg-white/[0.035] text-xl font-black text-white/60">
                {initials(player.ign)}
              </div>
              <div>
                <p className="pr-kicker">
                  Player dossier · {player.country || "India"}
                </p>
                <h1 className="mt-4 text-[clamp(4rem,9vw,8.5rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">
                  {player.ign}
                </h1>
                <p className="mt-5 text-xs font-bold uppercase tracking-[.17em] text-white/35">
                  {player.role || "Player"} ·{" "}
                  {player.team?.name || "Free agent"} ·{" "}
                  {player.active === false ? "Inactive" : "Active"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/players/compare?player1=${player.slug}`}
                className="pr-button pr-button-primary text-[10px]"
              >
                Compare player
              </Link>
              {player.team ? (
                <Link
                  href={`/teams/${player.team.slug}`}
                  className="pr-button pr-button-secondary text-[10px]"
                >
                  View team
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-6">
          {[
            [rank ? `#${rank}` : "—", "Rank"],
            [Math.round(ranking?.score || 0), "Score"],
            [movement(ranking?.change), "Movement"],
            [impact, "Impact"],
            [avgKills.toFixed(1), "Kills / match"],
            [Math.round(avgDamage), "Avg damage"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-4 py-7 first:border-l"
            >
              <p className="text-xl font-semibold tracking-[-.04em]">{value}</p>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/28">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="pr-container grid gap-12 py-18 lg:grid-cols-[1.15fr_.85fr]">
        <Reveal>
          <div>
            <p className="pr-kicker">Ranking trajectory</p>
            <div className="mt-5 border-y border-white/15 py-6">
              {history.length ? (
                <RankHistoryChart history={history} />
              ) : (
                <p className="py-16 text-sm text-white/35">
                  Ranking history will appear after the next snapshot.
                </p>
              )}
            </div>
            <p className="mt-4 text-xs leading-6 text-white/35">
              Latest ranking update:{" "}
              {formatDate(ranking?.updated_at || history.at(-1)?.snapshot_date)}
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div>
            <p className="pr-kicker">Performance identity</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em]">
              {archetype}.
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/45">
              {player.ign} has produced {kills} eliminations and{" "}
              {Math.round(damage).toLocaleString("en-IN")} damage across{" "}
              {matches} tracked matches. The current sample yields{" "}
              {avgKills.toFixed(1)} kills and {Math.round(avgDamage)} damage per
              match.
            </p>
            <div className="mt-8 grid grid-cols-2 border border-white/15">
              <Insight value={mvps} label="MVP records" />
              <Insight value={assists} label="Assists" />
              <Insight value={knocks} label="Knocks" />
              <Insight
                value={player.verified ? "Verified" : "Recorded"}
                label="Data status"
              />
            </div>
          </div>
        </Reveal>
      </section>
      <section className="border-y border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-16">
          <div className="flex items-end justify-between border-b border-white/15 pb-7">
            <div>
              <p className="pr-kicker">Recent output</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">
                Last five records.
              </h2>
            </div>
            <Crosshair size={20} className="text-[var(--pr-red)]" />
          </div>
          <div>
            {recent.length ? (
              recent.map((row, index) => {
                const content = (
                  <>
                    <span className="text-xl font-semibold text-[var(--pr-gold)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-semibold">
                        {row.kills || 0} kills · {Math.round(row.damage || 0)}{" "}
                        damage
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
                        Placement {row.placement || "—"} · {row.assists || 0}{" "}
                        assists · {row.knocks || 0} knocks
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-white/20" />
                  </>
                );
                return row.match_id ? (
                  <Link
                    key={row.id}
                    href={`/match/${row.match_id}`}
                    className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-white/10 py-5 hover:bg-white/[.02]"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={row.id}
                    className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-white/10 py-5"
                  >
                    {content}
                  </div>
                );
              })
            ) : (
              <p className="py-12 text-white/35">
                No recent player match records found.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="pr-container grid gap-12 py-18 lg:grid-cols-2">
        <div>
          <Radar size={20} className="text-[var(--pr-red)]" />
          <p className="pr-kicker mt-5">Career context</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-.04em]">
            Performance in context.
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/45">
            Role: {player.role || "Player"}. Team:{" "}
            {player.team?.name || "Free agent"}. Record source:{" "}
            {sourceLabel(player.source)}. Match volume and promoted statistics
            determine the confidence of this profile.
          </p>
        </div>
        <div className="grid grid-cols-2 border border-white/15">
          <Insight value={player.kd_ratio || 0} label="Listed KD" />
          <Insight
            value={player.win_rate ? `${player.win_rate}%` : "—"}
            label="Win rate"
          />
          <Insight
            value={
              player.team?.global_rank ? `#${player.team.global_rank}` : "—"
            }
            label="Team rank"
          />
          <Insight value={sourceLabel(player.source)} label="Source" />
        </div>
      </section>
      <section className="pr-container pb-18">
        <div className="grid gap-6 border-y border-white/15 py-8 md:grid-cols-[auto_1fr]">
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            This dossier combines the latest player ranking snapshot with
            available roster and promoted match statistics. Player rankings
            remain directional while competitive sample sizes develop and are
            not outcome predictions.
          </p>
        </div>
      </section>
    </main>
  );
}
function Insight({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="border-b border-r border-white/15 p-5">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
        {label}
      </p>
    </div>
  );
}
