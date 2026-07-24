import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
type Team = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  verified: boolean | null;
};
type Ranking = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
};
type Match = {
  id: string;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
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
export default async function TeamCompareDynamicPage({
  params,
}: {
  params: Promise<{ team1: string; team2: string }>;
}) {
  const { team1, team2 } = await params;
  const [aResult, bResult] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id,name,short_name,slug,country,logo_url,points,kills,wins,matches_played,verified",
      )
      .eq("slug", team1)
      .maybeSingle(),
    supabase
      .from("teams")
      .select(
        "id,name,short_name,slug,country,logo_url,points,kills,wins,matches_played,verified",
      )
      .eq("slug", team2)
      .maybeSingle(),
  ]);
  const a = aResult.data as Team | null,
    b = bResult.data as Team | null;
  if (!a || !b) notFound();
  const [rankingResult, h2hResult] = await Promise.all([
    supabase
      .from("rankings")
      .select("entity_id,rank,score,change")
      .eq("entity_type", "team")
      .in("entity_id", [a.id, b.id]),
    supabase
      .from("matches")
      .select("id,winner_team_id,team1_score,team2_score,map_name,stage,date")
      .or(
        `and(team1_id.eq.${a.id},team2_id.eq.${b.id}),and(team1_id.eq.${b.id},team2_id.eq.${a.id})`,
      )
      .order("date", { ascending: false }),
  ]);
  const rankings = (rankingResult.data || []) as Ranking[],
    matches = (h2hResult.data || []) as Match[],
    ra = rankings.find((row) => row.entity_id === a.id),
    rb = rankings.find((row) => row.entity_id === b.id);
  const metrics = [
    {
      label: "Ranking score",
      a: num(ra?.score ?? a.points),
      b: num(rb?.score ?? b.points),
    },
    { label: "Wins", a: num(a.wins), b: num(b.wins) },
    { label: "Kills", a: num(a.kills), b: num(b.kills) },
    { label: "Matches", a: num(a.matches_played), b: num(b.matches_played) },
    {
      label: "Kills / match",
      a: num(a.matches_played) ? num(a.kills) / num(a.matches_played) : 0,
      b: num(b.matches_played) ? num(b.kills) / num(b.matches_played) : 0,
    },
    {
      label: "Head-to-head wins",
      a: matches.filter((match) => match.winner_team_id === a.id).length,
      b: matches.filter((match) => match.winner_team_id === b.id).length,
    },
  ];
  const pointsA = metrics.reduce(
      (sum, row) => sum + (row.a > row.b ? 1 : 0),
      0,
    ),
    pointsB = metrics.reduce((sum, row) => sum + (row.b > row.a ? 1 : 0), 0),
    leader = pointsA === pointsB ? null : pointsA > pointsB ? a : b;
  return (
    <Report
      type="Team"
      back="/teams/compare"
      a={a}
      b={b}
      rankA={ra?.rank || null}
      rankB={rb?.rank || null}
      metrics={metrics}
      pointsA={pointsA}
      pointsB={pointsB}
      leader={leader}
      meetings={matches.length}
    />
  );
}
function Report({
  type,
  back,
  a,
  b,
  rankA,
  rankB,
  metrics,
  pointsA,
  pointsB,
  leader,
  meetings,
}: {
  type: string;
  back: string;
  a: Team;
  b: Team;
  rankA: number | null;
  rankB: number | null;
  metrics: { label: string; a: number; b: number }[];
  pointsA: number;
  pointsB: number;
  leader: Team | null;
  meetings: number;
}) {
  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-12 md:py-18">
          <Link
            href={back}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35"
          >
            <ArrowLeft size={13} /> New comparison
          </Link>
          <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-end gap-5">
            <Identity team={a} rank={rankA} />
            <div className="pb-3 text-center">
              <Swords size={20} className="mx-auto text-[var(--pr-red)]" />
              <p className="mt-3 text-[9px] uppercase tracking-[.18em] text-white/25">
                {type} versus
              </p>
            </div>
            <Identity team={b} rank={rankB} right />
          </div>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          <Score value={pointsA} label={a.short_name || a.name} />
          <Score
            value={pointsA === pointsB ? "Draw" : leader?.name || "Draw"}
            label="Metric verdict"
            accent
          />
          <Score value={pointsB} label={b.short_name || b.name} />
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
            Verdict is based on advantages across {metrics.length} available
            metrics. The teams have {meetings} recorded head-to-head meetings.
            Missing data is represented as zero in source records and may reduce
            confidence.
          </p>
          <p className="mt-6 text-xs uppercase tracking-[.15em] text-white/25">
            Coverage:{" "}
            {a.verified && b.verified
              ? "Both teams verified"
              : "Mixed verification"}
          </p>
        </div>
      </section>
    </main>
  );
}
function Identity({
  team,
  rank,
  right = false,
}: {
  team: Team;
  rank: number | null;
  right?: boolean;
}) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className={`${right ? "text-right" : ""}`}
    >
      <div className={`flex ${right ? "justify-end" : ""}`}>
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden border border-white/15">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={`${team.name} logo`}
              width={80}
              height={80}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="font-black text-white/50">
              {initials(team.name)}
            </span>
          )}
        </div>
      </div>
      <h1 className="mt-5 text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[.9] tracking-[-.06em]">
        {team.name}
      </h1>
      <p className="mt-3 text-[9px] uppercase tracking-[.15em] text-white/25">
        {rank ? `Rank #${rank}` : "Unranked"}
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
