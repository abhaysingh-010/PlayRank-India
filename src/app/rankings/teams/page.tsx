import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/home/HomeMotion";
import { supabase } from "@/lib/supabase";

type RankingRow = { id: string; entity_id: string; rank: number; score: number; change: number | null; updated_at: string | null };
type TeamRow = { id: string; name: string; short_name: string | null; slug: string; country: string | null; logo_url: string | null; wins: number | null; kills: number | null; matches_played: number | null; source: string | null; verified: boolean | null };

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not available";
}

function initials(value: string) {
  return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function TeamMark({ team, large = false }: { team: TeamRow; large?: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035] ${large ? "h-20 w-20" : "h-12 w-12"}`}>
      {team.logo_url ? <Image src={team.logo_url} alt={`${team.name} logo`} width={large ? 80 : 48} height={large ? 80 : 48} className="h-full w-full object-contain p-2" /> : <span className="text-xs font-black text-white/60">{initials(team.name)}</span>}
    </div>
  );
}

function Movement({ value }: { value: number | null }) {
  if (!value) return <span className="inline-flex items-center gap-1 text-white/30"><Minus size={13} /> 0</span>;
  if (value > 0) return <span className="inline-flex items-center gap-1 text-[var(--pr-positive)]"><ArrowUp size={13} /> {value}</span>;
  return <span className="inline-flex items-center gap-1 text-[var(--pr-red)]"><ArrowDown size={13} /> {Math.abs(value)}</span>;
}

export default async function TeamRankingsPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const requestedPage = Number.parseInt(params.page || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const [rankingsResult, podiumResult, snapshotResult, countResult] = await Promise.all([
    supabase.from("rankings").select("id,entity_id,rank,score,change,updated_at", { count: "exact" }).eq("entity_type", "team").order("rank", { ascending: true }).range(offset, offset + pageSize - 1),
    supabase.from("rankings").select("id,entity_id,rank,score,change,updated_at").eq("entity_type", "team").order("rank", { ascending: true }).range(0, 2),
    supabase.from("ranking_history").select("snapshot_date,created_at").eq("entity_type", "team").order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("teams").select("*", { count: "exact", head: true }),
  ]);
  const rankings = (rankingsResult.data || []) as RankingRow[];
  const podiumRankings = (podiumResult.data || []) as RankingRow[];
  const ids = [...new Set([...rankings, ...podiumRankings].map((row) => row.entity_id))];
  const teamsResult = ids.length ? await supabase.from("teams").select("id,name,short_name,slug,country,logo_url,wins,kills,matches_played,source,verified").in("id", ids) : { data: [], error: null };

  if (rankingsResult.error || teamsResult.error) return <ErrorState />;

  const teams = (teamsResult.data || []) as TeamRow[];
  const byId = new Map(teams.map((team) => [team.id, team]));
  const ranked = rankings.map((ranking) => ({ ranking, team: byId.get(ranking.entity_id) })).filter((item): item is { ranking: RankingRow; team: TeamRow } => Boolean(item.team));
  const podium = podiumRankings.map((ranking) => ({ ranking, team: byId.get(ranking.entity_id) })).filter((item): item is { ranking: RankingRow; team: TeamRow } => Boolean(item.team));
  const snapshot = rankings[0]?.updated_at || snapshotResult.data?.snapshot_date || snapshotResult.data?.created_at || null;
  const totalRankings = rankingsResult.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalRankings / pageSize));

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container py-14 md:py-20">
          <Link href="/rankings" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 transition hover:text-white"><ArrowLeft size={13} /> Rankings overview</Link>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div><p className="pr-kicker">Official + verified team layer</p><h1 className="mt-5 text-[clamp(4.3rem,9vw,8.5rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">Team<br /><span className="text-[var(--pr-red)]">order.</span></h1></div>
            <div className="lg:pb-1"><p className="max-w-lg text-base leading-7 text-white/50">The current competitive hierarchy of Indian esports teams, with form, movement and performance context in one view.</p><div className="mt-7 flex gap-3"><Link href="/rankings/players" className="pr-button pr-button-secondary text-[10px]">Player rankings</Link><Link href="/teams" className="pr-button pr-button-primary text-[10px]">Team directory</Link></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-4">
          {[[formatDate(snapshot), "Latest snapshot"], [totalRankings.toLocaleString("en-IN"), "Ranked teams"], [(countResult.count || 0).toLocaleString("en-IN"), "Team database"], ["Source based", "Confidence"]].map(([value, label]) => <div key={label} className="border-r border-white/15 px-5 py-7 first:border-l md:px-7"><p className="text-lg font-semibold tracking-[-.03em] md:text-2xl">{value}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/30">{label}</p></div>)}
        </div>
      </section>

      {podium.length > 0 ? <section className="pr-container py-16 md:py-24">
        <Reveal><div className="border-b border-white/15 pb-7"><p className="pr-kicker">Front runners</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] md:text-6xl">The top three.</h2></div></Reveal>
        <div className="grid md:grid-cols-3">{podium.map(({ ranking, team }, index) => <Reveal key={team.id} delay={index * .08} className="border-b border-white/15 py-8 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"><Link href={`/teams/${team.slug}`} className="group block"><div className="flex items-start justify-between"><TeamMark team={team} large /><span className="text-7xl font-semibold tracking-[-.08em] text-[var(--pr-gold)]">{String(ranking.rank).padStart(2, "0")}</span></div><h3 className="mt-14 text-2xl font-semibold tracking-[-.04em]">{team.name}</h3><p className="mt-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/30">{team.short_name || team.country || "India"}</p><div className="mt-6 grid grid-cols-3 border-t border-white/15 pt-4"><Metric value={Math.round(ranking.score)} label="Score" /><Metric value={team.wins || 0} label="Wins" /><div className="text-right"><Movement value={ranking.change} /><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">Move</p></div></div></Link></Reveal>)}</div>
      </section> : null}

      <section className="border-y border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-16 md:py-20"><div className="flex flex-col gap-4 border-b border-white/15 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="pr-kicker">Complete table</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">Team leaderboard.</h2></div><p className="text-xs uppercase tracking-[.15em] text-white/30">Score · movement · match record</p></div>
          <div>{ranked.length ? ranked.map(({ ranking, team }) => <Link key={ranking.id} href={`/teams/${team.slug}`} className="pr-ranking-row group grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-white/10 py-5 md:grid-cols-[62px_1.4fr_repeat(4,.55fr)_24px] md:gap-5"><span className={`text-xl font-semibold ${ranking.rank <= 3 ? "text-[var(--pr-gold)]" : "text-white/45"}`}>{String(ranking.rank).padStart(2, "0")}</span><div className="flex min-w-0 items-center gap-3"><TeamMark team={team} /><div className="min-w-0"><p className="truncate font-semibold">{team.name}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">{team.short_name || team.country || "India"}</p></div></div><div className="text-right md:text-left"><p className="font-semibold">{Math.round(ranking.score)}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25 md:hidden">Score</p></div><RowMetric value={<Movement value={ranking.change} />} label="Movement" /><RowMetric value={team.wins || 0} label="Wins" /><RowMetric value={team.matches_played || 0} label="Matches" /><RowMetric value={team.kills || 0} label="Kills" /><ArrowRight size={15} className="hidden text-white/20 transition group-hover:text-[var(--pr-red)] md:block" /></Link>) : <p className="py-14 text-white/40">No team rankings are available yet.</p>}</div>
          <Pagination page={page} totalPages={totalPages} basePath="/rankings/teams" />
        </div>
      </section>

      <section className="pr-container py-14 md:py-18"><div className="grid gap-7 border-b border-white/15 pb-12 md:grid-cols-[.7fr_1.3fr]"><div><ShieldCheck size={20} className="text-[var(--pr-red)]" /><h2 className="mt-5 text-3xl font-semibold tracking-[-.04em]">Read the signal.</h2></div><p className="max-w-3xl text-sm leading-7 text-white/45">Team rankings use official and verified ranking records where available, structured alongside roster and match context. They are independent intelligence signals—not predictions or official tournament decisions. Snapshot shown: {formatDate(snapshot)}.</p></div></section>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) { return <div><p className="font-semibold">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">{label}</p></div>; }
function RowMetric({ value, label }: { value: React.ReactNode; label: string }) { return <div className="hidden md:block"><p className="text-sm font-semibold">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">{label}</p></div>; }
function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) { return <nav className="mt-8 flex items-center justify-between border-t border-white/15 pt-6" aria-label="Ranking pages"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">Page {Math.min(page, totalPages)} of {totalPages}</p><div className="flex gap-2">{page > 1 ? <Link href={`${basePath}?page=${page - 1}`} scroll={false} className="pr-button pr-button-secondary text-[10px]">Previous 10</Link> : null}{page < totalPages ? <Link href={`${basePath}?page=${page + 1}`} scroll={false} className="pr-button pr-button-primary text-[10px]">Next 10 <ArrowRight size={13} /></Link> : null}</div></nav>; }
function ErrorState() { return <main className="pr-container py-20"><section className="border border-[var(--pr-red)]/30 bg-[var(--pr-red)]/5 p-8"><p className="pr-kicker">Data unavailable</p><h1 className="mt-4 text-4xl font-semibold">Team rankings could not be loaded.</h1><p className="mt-3 text-white/45">Check Supabase permissions and the latest ranking snapshot.</p></section></main>; }
