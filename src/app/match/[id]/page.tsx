import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crosshair, ShieldCheck, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Team = {
  id: string;
  name: string;
  slug: string;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};
type Tournament = { id: string; name: string; slug: string };
type RawMatch = {
  id: string;
  tournament_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  source: string | null;
  verified: boolean | null;
  created_at: string | null;
  team1: Team | Team[] | null;
  team2: Team | Team[] | null;
  winner: Team | Team[] | null;
};
type Match = Omit<RawMatch, "team1" | "team2" | "winner"> & {
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
};
type Player = { id: string; ign: string; slug: string };
type RawPlayerStat = {
  id: string | number;
  player_id: string;
  match_id: string;
  kills: number | null;
  damage: number | null;
  placement: number | null;
  knocks: number | null;
  assists: number | null;
  revives: number | null;
  survival_time: number | null;
  is_mvp: boolean | null;
  mvp: boolean | null;
  player: Player | Player[] | null;
};
type PlayerStat = Omit<RawPlayerStat, "player"> & { player: Player | null };
type RawTeamStat = {
  id: string | number;
  team_id: string;
  match_id: string;
  placement: number | null;
  kills: number | null;
  placement_points: number | null;
  kill_points: number | null;
  total_points: number | null;
  survival_time: number | null;
  team: Team | Team[] | null;
};
type TeamStat = Omit<RawTeamStat, "team"> & { team: Team | null };
function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] || null : value;
}
function num(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "TBD";
}
function sourceLabel(source: string | null, verified: boolean | null) {
  if (source === "pubg_developer_api") return "PUBG API promoted";
  if (source === "pubg_api") return "PUBG API";
  if (source === "krafton_india_esports") return "Official Krafton";
  return verified ? "Verified match" : "Match record";
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: raw, error } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,team1_id,team2_id,winner_team_id,team1_score,team2_score,map_name,stage,date,source,verified,created_at,team1:team1_id(id,name,slug,source,verified,active),team2:team2_id(id,name,slug,source,verified,active),winner:winner_team_id(id,name,slug,source,verified,active)",
    )
    .eq("id", id)
    .single();
  if (error || !raw) notFound();
  const rawMatch = raw as RawMatch;
  const match = {
    ...rawMatch,
    team1: one(rawMatch.team1),
    team2: one(rawMatch.team2),
    winner: one(rawMatch.winner),
  } as Match;
  const [playerResult, teamResult, tournamentResult] = await Promise.all([
    supabase
      .from("player_match_stats")
      .select(
        "id,player_id,match_id,kills,damage,placement,knocks,assists,revives,survival_time,is_mvp,mvp,player:player_id(id,ign,slug)",
      )
      .eq("match_id", id)
      .order("kills", { ascending: false }),
    supabase
      .from("team_match_results")
      .select(
        "id,team_id,match_id,placement,kills,placement_points,kill_points,total_points,survival_time,team:team_id(id,name,slug,source,verified,active)",
      )
      .eq("match_id", id)
      .order("total_points", { ascending: false }),
    match.tournament_id
      ? supabase
          .from("tournaments")
          .select("id,name,slug")
          .eq("id", match.tournament_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const players = ((playerResult.data || []) as RawPlayerStat[]).map((row) => ({
    ...row,
    player: one(row.player),
  })) as PlayerStat[];
  const teams = ((teamResult.data || []) as RawTeamStat[]).map((row) => ({
    ...row,
    team: one(row.team),
  })) as TeamStat[];
  const tournament = tournamentResult.data as Tournament | null;
  const h2h = Boolean(match.team1 || match.team2),
    topTeam =
      [...teams].sort((a, b) => num(b.total_points) - num(a.total_points))[0] ||
      null;
  const mvp =
    players.find((row) => row.is_mvp || row.mvp) || players[0] || null;
  const totalKills =
      players.reduce((sum, row) => sum + num(row.kills), 0) ||
      teams.reduce((sum, row) => sum + num(row.kills), 0),
    totalDamage = players.reduce((sum, row) => sum + num(row.damage), 0);
  const winner = match.winner || topTeam?.team || null;
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-12 md:py-18">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 hover:text-white"
          >
            <ArrowLeft size={13} /> Match centre
          </Link>
          <div className="mt-12 flex flex-col gap-7 border-b border-white/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="pr-kicker">
                {match.stage || "Match"} · {match.map_name || "Map TBD"}
              </p>
              <h1 className="mt-4 text-[clamp(3.8rem,8vw,8rem)] font-semibold uppercase leading-[.8] tracking-[-.075em]">
                Match
                <br />
                <span className="text-[var(--pr-red)]">report.</span>
              </h1>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-lg font-semibold">{formatDate(match.date)}</p>
              {tournament ? (
                <Link
                  href={`/tournaments/${tournament.slug}`}
                  className="mt-3 inline-flex text-sm text-[var(--pr-gold)] hover:text-white"
                >
                  {tournament.name}
                </Link>
              ) : null}
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
                {sourceLabel(match.source, match.verified)}
              </p>
            </div>
          </div>
          {h2h ? (
            <div className="grid items-center gap-7 py-12 md:grid-cols-[1fr_auto_1fr]">
              <TeamIdentity team={match.team1} />
              <div className="text-center">
                <p className="text-[clamp(4rem,8vw,7rem)] font-semibold leading-none tracking-[-.08em]">
                  <span>{num(match.team1_score)}</span>
                  <span className="px-4 text-white/18">:</span>
                  <span>{num(match.team2_score)}</span>
                </p>
                <p className="mt-4 text-[9px] font-bold uppercase tracking-[.18em] text-white/25">
                  Final score
                </p>
              </div>
              <TeamIdentity team={match.team2} right />
            </div>
          ) : (
            <div className="grid gap-8 py-12 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="pr-kicker">Battle royale result</p>
                <h2 className="mt-5 text-5xl font-semibold tracking-[-.06em]">
                  {winner?.name || "Result pending"}
                </h2>
              </div>
              <div className="lg:text-right">
                <p className="text-6xl font-semibold text-[var(--pr-gold)]">
                  #{topTeam?.placement || "—"}
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[.15em] text-white/25">
                  Top placement
                </p>
              </div>
            </div>
          )}
          {winner ? (
            <div className="flex items-center gap-4 border-t border-white/15 py-6">
              <Trophy size={18} className="text-[var(--pr-gold)]" />
              <p className="text-xs font-bold uppercase tracking-[.16em] text-white/35">
                Winner{" "}
                <Link
                  href={`/teams/${winner.slug}`}
                  className="ml-3 text-white hover:text-[var(--pr-gold)]"
                >
                  {winner.name}
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-5">
          {[
            [totalKills, "Total kills"],
            [totalDamage.toLocaleString("en-IN"), "Total damage"],
            [teams.length || (h2h ? 2 : 0), "Teams"],
            [players.length, "Player records"],
            [mvp?.player?.ign || "—", "Top player"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-4 py-7 first:border-l"
            >
              <p className="truncate text-xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.14em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="pr-container grid gap-12 py-18 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex items-end justify-between border-b border-white/15 pb-6">
            <div>
              <p className="pr-kicker">Squad output</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">
                Team standings.
              </h2>
            </div>
            <Trophy size={19} className="text-[var(--pr-gold)]" />
          </div>
          {teams.length ? (
            teams.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[48px_1fr_repeat(2,auto)] items-center gap-4 border-b border-white/10 py-5"
              >
                <span
                  className={`text-xl font-semibold ${row.placement === 1 ? "text-[var(--pr-gold)]" : "text-white/40"}`}
                >
                  {String(row.placement || 0).padStart(2, "0")}
                </span>
                <div>
                  {row.team ? (
                    <Link
                      href={`/teams/${row.team.slug}`}
                      className="font-semibold hover:text-[var(--pr-gold)]"
                    >
                      {row.team.name}
                    </Link>
                  ) : (
                    <p className="font-semibold">Team</p>
                  )}
                  <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
                    {row.kills || 0} kills
                  </p>
                </div>
                <Stat value={row.placement_points || 0} label="Place pts" />
                <Stat value={row.total_points || 0} label="Total" />
              </div>
            ))
          ) : (
            <p className="py-10 text-white/35">
              No team result rows are available.
            </p>
          )}
        </div>
        <div>
          <div className="flex items-end justify-between border-b border-white/15 pb-6">
            <div>
              <p className="pr-kicker">Individual output</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">
                Player sheet.
              </h2>
            </div>
            <Crosshair size={19} className="text-[var(--pr-red)]" />
          </div>
          {players.length ? (
            players.slice(0, 12).map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[38px_1fr_repeat(2,auto)] items-center gap-4 border-b border-white/10 py-5"
              >
                <span className="text-sm text-white/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  {row.player ? (
                    <Link
                      href={`/players/${row.player.slug}`}
                      className="font-semibold hover:text-[var(--pr-gold)]"
                    >
                      {row.player.ign}
                    </Link>
                  ) : (
                    <p className="font-semibold">Player</p>
                  )}
                  <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
                    {row.assists || 0} assists · {row.knocks || 0} knocks
                  </p>
                </div>
                <Stat value={row.kills || 0} label="Kills" />
                <Stat value={Math.round(row.damage || 0)} label="Damage" />
              </div>
            ))
          ) : (
            <p className="py-10 text-white/35">
              No player statistics are available.
            </p>
          )}
        </div>
      </section>
      {mvp?.player ? (
        <section className="border-y border-white/15 bg-[var(--pr-surface)]">
          <div className="pr-container grid gap-8 py-14 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div>
              <p className="pr-kicker">Match standout</p>
              <Link
                href={`/players/${mvp.player.slug}`}
                className="mt-4 block text-5xl font-semibold tracking-[-.06em] hover:text-[var(--pr-gold)]"
              >
                {mvp.player.ign}
              </Link>
            </div>
            <div className="grid grid-cols-3 border border-white/15">
              <Highlight value={mvp.kills || 0} label="Kills" />
              <Highlight value={Math.round(mvp.damage || 0)} label="Damage" />
              <Highlight value={mvp.assists || 0} label="Assists" />
            </div>
          </div>
        </section>
      ) : null}
      <section className="pr-container py-14">
        <div className="grid gap-6 border-y border-white/15 py-8 md:grid-cols-[auto_1fr]">
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            This report uses normalized match, team-result and player-stat
            records. API-sourced data appears after controlled promotion into
            PlayRank core tables. Analytics describe recorded performance and
            are not predictions.
          </p>
        </div>
      </section>
    </main>
  );
}
function TeamIdentity({
  team,
  right = false,
}: {
  team: Team | null;
  right?: boolean;
}) {
  return (
    <div className={`${right ? "text-right" : ""}`}>
      {team ? (
        <Link
          href={`/teams/${team.slug}`}
          className="text-3xl font-semibold tracking-[-.045em] hover:text-[var(--pr-gold)]"
        >
          {team.name}
        </Link>
      ) : (
        <p className="text-3xl font-semibold text-white/35">Team TBD</p>
      )}
      <p className="mt-3 text-[9px] uppercase tracking-[.15em] text-white/25">
        {right ? "Team two" : "Team one"}
      </p>
    </div>
  );
}
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-right">
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-[8px] uppercase tracking-[.13em] text-white/25">
        {label}
      </p>
    </div>
  );
}
function Highlight({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-white/15 p-5 last:border-r-0">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-[9px] uppercase tracking-[.14em] text-white/25">
        {label}
      </p>
    </div>
  );
}
