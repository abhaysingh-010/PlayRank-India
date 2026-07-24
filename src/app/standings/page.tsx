import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
type Team = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_url: string | null;
};
type Raw = {
  id: string;
  tournament_id: string | null;
  team_id: string;
  rank: number | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  team: Team | Team[] | null;
};
type Row = Omit<Raw, "team"> & { team: Team | null };
type Board = Team & {
  points: number;
  kills: number;
  wins: number;
  matches: number;
  events: number;
  best: number | null;
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
function Mark({ team }: { team: Team }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden border border-white/15">
      {team.logo_url ? (
        <Image
          src={team.logo_url}
          alt={`${team.name} logo`}
          width={48}
          height={48}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-[10px] font-black text-white/45">
          {initials(team.name)}
        </span>
      )}
    </div>
  );
}
export default async function StandingsPage() {
  const { data, error } = await supabase
    .from("tournament_standings")
    .select(
      "id,tournament_id,team_id,rank,points,kills,wins,matches_played,team:team_id(id,name,short_name,slug,logo_url)",
    )
    .order("rank", { ascending: true });
  if (error)
    return (
      <main className="pr-container py-20">
        <h1 className="text-5xl font-semibold text-white">
          Standings could not be loaded.
        </h1>
      </main>
    );
  const rows = ((data || []) as Raw[]).map((row) => ({
    ...row,
    team: one(row.team),
  })) as Row[];
  const map = new Map<string, Board>();
  for (const row of rows) {
    if (!row.team) continue;
    const item = map.get(row.team_id) || {
      ...row.team,
      points: 0,
      kills: 0,
      wins: 0,
      matches: 0,
      events: 0,
      best: null,
    };
    item.points += num(row.points);
    item.kills += num(row.kills);
    item.wins += num(row.wins);
    item.matches += num(row.matches_played);
    item.events += 1;
    if (row.rank)
      item.best = item.best === null ? row.rank : Math.min(item.best, row.rank);
    map.set(row.team_id, item);
  }
  const board = [...map.values()].sort(
    (a, b) => b.points - a.points || b.kills - a.kills,
  );
  const events = new Set(rows.map((row) => row.tournament_id).filter(Boolean))
    .size;
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="pr-kicker">Aggregate tournament performance</p>
            <h1 className="mt-5 text-[clamp(4.5rem,9vw,9rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">
              Team
              <br />
              <span className="text-[var(--pr-red)]">standings.</span>
            </h1>
          </div>
          <div>
            <p className="max-w-xl text-base leading-7 text-white/50">
              A cross-event view of published standing rows, ordered by
              accumulated points and then eliminations.
            </p>
            <div className="mt-7">
              <Link
                href="/tournaments"
                className="pr-button pr-button-primary text-[10px]"
              >
                Tournament register
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          {[
            [board.length, "Teams"],
            [rows.length, "Standing rows"],
            [events, "Events"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l"
            >
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.15em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      {board.length ? (
        <section className="pr-container py-16 md:py-22">
          <div className="flex items-end justify-between border-b border-white/15 pb-7">
            <div>
              <p className="pr-kicker">The podium</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
                Aggregate leaders.
              </h2>
            </div>
            <Trophy size={20} className="text-[var(--pr-gold)]" />
          </div>
          <div className="grid md:grid-cols-3">
            {board.slice(0, 3).map((team, index) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="border-b border-white/15 py-8 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"
              >
                <div className="flex items-start justify-between">
                  <Mark team={team} />
                  <span className="text-6xl font-semibold tracking-[-.08em] text-[var(--pr-gold)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-12 text-2xl font-semibold">{team.name}</h3>
                <p className="mt-4 text-sm text-white/40">
                  {team.points} points · {team.kills} kills · {team.wins} wins
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <section className="border-y border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-16">
          <div className="border-b border-white/15 pb-7">
            <p className="pr-kicker">Complete aggregate</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">
              Competitive table.
            </h2>
          </div>
          <div>
            {board.length ? (
              board.map((team, index) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.slug}`}
                  className="pr-ranking-row group grid grid-cols-[46px_1fr_auto] items-center gap-4 border-b border-white/10 py-5 md:grid-cols-[64px_1.4fr_repeat(5,.55fr)_20px]"
                >
                  <span
                    className={`text-xl font-semibold ${index < 3 ? "text-[var(--pr-gold)]" : "text-white/40"}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-4">
                    <Mark team={team} />
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
                        {team.short_name || "Team"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right md:text-left">
                    <p className="font-semibold">{team.points}</p>
                    <p className="text-[8px] uppercase text-white/25">Points</p>
                  </div>
                  <Stat value={team.kills} label="Kills" />
                  <Stat value={team.wins} label="Wins" />
                  <Stat value={team.matches} label="Matches" />
                  <Stat value={team.events} label="Events" />
                  <Stat
                    value={team.best ? `#${team.best}` : "—"}
                    label="Best"
                  />
                  <ArrowRight
                    size={14}
                    className="hidden text-white/20 group-hover:text-[var(--pr-red)] md:block"
                  />
                </Link>
              ))
            ) : (
              <p className="py-12 text-white/35">No standings available.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="hidden md:block">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[8px] uppercase tracking-[.13em] text-white/25">
        {label}
      </p>
    </div>
  );
}
