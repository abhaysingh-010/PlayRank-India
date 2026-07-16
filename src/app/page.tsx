import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BarChart3, Database, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AnimatedCount, HeroTitle, PageProgress, Reveal } from "@/components/home/HomeMotion";

type RankingRow = { entity_id: string; rank: number; score: number; change: number | null };
type TeamRow = { id: string; name: string; short_name: string | null; slug: string; logo_url: string | null };
type PlayerTeam = { name: string; short_name: string | null };
type PlayerRow = { id: string; ign: string; slug: string; role: string | null; team: PlayerTeam | null };
type PlayerRaw = Omit<PlayerRow, "team"> & { team: PlayerTeam | PlayerTeam[] | null };
type MatchTeam = { name: string; slug: string };
type MatchRow = { id: string; map_name: string | null; stage: string | null; date: string | null; team1_score: number | null; team2_score: number | null; team1: MatchTeam | null; team2: MatchTeam | null; winner: MatchTeam | null };
type MatchRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & { team1: MatchTeam | MatchTeam[] | null; team2: MatchTeam | MatchTeam[] | null; winner: MatchTeam | MatchTeam[] | null };
type TournamentRow = { id: string; name: string; slug: string; status: string | null; start_date: string | null };

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] || null : value; }
function initials(value: string) { return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBD"; }
function formatScore(value?: number | null) { const score = Number(value || 0); return score >= 1000 ? `${(score / 1000).toFixed(1)}K` : Math.round(score).toString(); }

function TeamMark({ team, large = false }: { team: TeamRow; large?: boolean }) {
  return (
    <div className={`${large ? "h-24 w-24 md:h-32 md:w-32" : "h-12 w-12"} flex shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.04]`}>
      {team.logo_url ? <Image src={team.logo_url} alt={`${team.name} logo`} width={128} height={128} className="h-full w-full object-contain p-3" /> : <span className={`${large ? "text-2xl" : "text-xs"} font-black text-white/70`}>{initials(team.name)}</span>}
    </div>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-l border-white/15 pl-4 md:pl-6">
      <p className="text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl"><AnimatedCount value={value} /></p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">{label}</p>
    </div>
  );
}

export default async function HomePage() {
  const [teamRankingResult, playerRankingResult, playerCountResult, teamCountResult, matchCountResult, tournamentCountResult, recentMatchResult, tournamentResult] = await Promise.all([
    supabase.from("rankings").select("entity_id, rank, score, change").eq("entity_type", "team").order("rank", { ascending: true }).limit(1),
    supabase.from("rankings").select("entity_id, rank, score, change").eq("entity_type", "player").order("rank", { ascending: true }).limit(1),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("id,map_name,stage,date,team1_score,team2_score,team1:team1_id(name,slug),team2:team2_id(name,slug),winner:winner_team_id(name,slug)").order("date", { ascending: false }).limit(1),
    supabase.from("tournaments").select("id,name,slug,status,start_date").order("start_date", { ascending: false }).limit(1),
  ]);

  const teamRanking = (teamRankingResult.data || [])[0] as RankingRow | undefined;
  const playerRanking = (playerRankingResult.data || [])[0] as RankingRow | undefined;
  let topTeam: TeamRow | null = null;
  let topPlayer: PlayerRow | null = null;

  if (teamRanking?.entity_id) {
    const { data } = await supabase.from("teams").select("id,name,short_name,slug,logo_url").eq("id", teamRanking.entity_id).maybeSingle();
    topTeam = data as TeamRow | null;
  }

  if (playerRanking?.entity_id) {
    const { data } = await supabase.from("players").select("id,ign,slug,role,team:team_id(name,short_name)").eq("id", playerRanking.entity_id).maybeSingle();
    const raw = data as PlayerRaw | null;
    topPlayer = raw ? { ...raw, team: one(raw.team) } : null;
  }

  const rawMatch = (recentMatchResult.data || [])[0] as MatchRaw | undefined;
  const recentMatch = rawMatch ? { ...rawMatch, team1: one(rawMatch.team1), team2: one(rawMatch.team2), winner: one(rawMatch.winner) } : null;
  const tournament = (tournamentResult.data || [])[0] as TournamentRow | undefined;

  return (
    <main className="overflow-hidden bg-[var(--pr-bg)] text-white">
      <PageProgress />
      <section className="relative border-b border-white/15">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:25vw_25vw]" />
        <div className="pr-container relative flex min-h-[680px] flex-col justify-between py-9 md:min-h-[760px] md:py-12">
          <div className="flex items-center justify-between gap-6">
            <p className="pr-kicker">Indian esports intelligence</p>
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 sm:block">Rankings · Players · Matches · History</p>
          </div>

          <div className="py-14 md:py-16">
            <HeroTitle />
          </div>

          <Reveal className="grid gap-8 border-t border-white/15 pt-7 md:grid-cols-[1.2fr_.8fr] md:items-end" delay={0.4} distance={18}>
            <p className="max-w-xl text-base leading-7 text-white/55 md:text-lg">
              Rankings, competitive history and performance intelligence—built to make India&apos;s esports ecosystem easier to understand.
            </p>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/rankings" className="pr-button pr-button-primary text-xs">Explore rankings <ArrowRight size={15} /></Link>
              <Link href="#pulse" className="pr-button pr-button-secondary gap-2 text-xs">See the data <ArrowDown size={15} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pulse" className="pr-container py-20 md:py-24">
        <Reveal className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="pr-kicker">Competitive pulse</p>
            <h2 className="pr-section-title mt-5">One ecosystem.<br />Connected by data.</h2>
            <p className="mt-7 max-w-md text-base leading-7 text-white/48">Every verified team, player, match and tournament strengthens the context behind the rankings.</p>
          </div>
          <div className="grid grid-cols-2 gap-y-10 border-t border-white/15 pt-8 md:grid-cols-4 lg:border-t-0 lg:pt-3">
            <Count value={teamCountResult.count || 0} label="Teams" />
            <Count value={playerCountResult.count || 0} label="Players" />
            <Count value={matchCountResult.count || 0} label="Matches" />
            <Count value={tournamentCountResult.count || 0} label="Events" />
          </div>
        </Reveal>
      </section>

      {topTeam && teamRanking ? (
        <section className="pr-featured-team border-y border-white/15">
          <Link href={`/teams/${topTeam.slug}`} className="group pr-container grid gap-10 py-16 md:grid-cols-[.72fr_1.28fr] md:items-center md:py-20">
            <div>
              <p className="pr-featured-label text-[11px] font-black uppercase tracking-[0.22em]">Current number one</p>
              <p className="pr-featured-rank mt-4 text-[clamp(6rem,15vw,12rem)] font-semibold leading-[.72] tracking-[-.09em]">01</p>
              <div className="mt-10 flex items-center gap-5"><TeamMark team={topTeam} large /><div><p className="pr-featured-name text-2xl font-bold">{topTeam.name}</p><p className="pr-featured-meta mt-1 text-sm">{formatScore(teamRanking.score)} ranking points</p></div></div>
            </div>
            <div className="md:border-l md:border-white/15 md:pl-16">
              <h2 className="pr-featured-title text-[clamp(3.2rem,6vw,6.5rem)] font-semibold leading-[.86] tracking-[-.065em]">THE TEAM<br />SETTING THE<br />STANDARD.</h2>
              <p className="pr-featured-link mt-9 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[.18em]">View team intelligence <ArrowRight className="transition group-hover:translate-x-2" size={17} /></p>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="pr-container py-20 md:py-24">
        <Reveal className="flex flex-col gap-6 border-b border-white/15 pb-10 md:flex-row md:items-end md:justify-between">
          <div><p className="pr-kicker">Latest signals</p><h2 className="pr-section-title mt-5">What&apos;s moving now.</h2></div>
          <Link href="/matches" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-white/55 hover:text-white">All matches <ArrowRight size={16} /></Link>
        </Reveal>

        <div className="grid lg:grid-cols-3">
          <Reveal className="pr-signal-card border-b border-white/15 py-8 lg:border-b-0 lg:border-r lg:pr-8">
          <article>
            <div className="flex items-center justify-between"><span className="pr-kicker">Latest match</span><Swords size={18} className="text-white/35" /></div>
            {recentMatch ? <Link href={`/match/${recentMatch.id}`} className="group mt-16 block"><p className="text-xs uppercase tracking-[.18em] text-white/38">{recentMatch.stage || "Competitive match"} · {formatDate(recentMatch.date)}</p><div className="mt-7 space-y-4 text-2xl font-semibold"><div className="flex justify-between gap-4"><span>{recentMatch.team1?.name || "Team 1"}</span><span>{recentMatch.team1_score ?? 0}</span></div><div className="flex justify-between gap-4"><span>{recentMatch.team2?.name || "Team 2"}</span><span>{recentMatch.team2_score ?? 0}</span></div></div><p className="mt-10 text-sm text-white/45">Winner <span className="font-bold text-[var(--pr-gold)]">{recentMatch.winner?.name || "Pending"}</span></p></Link> : <p className="mt-16 text-white/40">No match data available.</p>}
          </article>
          </Reveal>

          <Reveal className="pr-signal-card border-b border-white/15 py-8 lg:border-b-0 lg:border-r lg:px-8" delay={0.1}>
          <article>
            <div className="flex items-center justify-between"><span className="pr-kicker">Top player</span><BarChart3 size={18} className="text-white/35" /></div>
            {topPlayer && playerRanking ? <Link href={`/players/${topPlayer.slug}`} className="group mt-16 block"><p className="text-6xl font-semibold tracking-[-.06em]">{topPlayer.ign}</p><p className="mt-4 text-sm text-white/45">{topPlayer.role || "Competitive player"} · {topPlayer.team?.short_name || topPlayer.team?.name || "Independent"}</p><div className="mt-12 flex items-end justify-between border-t border-white/15 pt-5"><span className="text-xs font-bold uppercase tracking-[.16em] text-white/40">Player rank</span><span className="text-5xl font-semibold text-[var(--pr-gold)]">#{playerRanking.rank}</span></div></Link> : <p className="mt-16 text-white/40">No player ranking available.</p>}
          </article>
          </Reveal>

          <Reveal className="pr-signal-card py-8 lg:pl-8" delay={0.2}>
          <article>
            <div className="flex items-center justify-between"><span className="pr-kicker">Latest event</span><Database size={18} className="text-white/35" /></div>
            {tournament ? <Link href={`/tournaments/${tournament.slug}`} className="group mt-16 block"><p className="text-4xl font-semibold leading-[1] tracking-[-.05em]">{tournament.name}</p><div className="mt-12 border-t border-white/15 pt-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-white/40">{tournament.status || "Status pending"}</p><p className="mt-3 text-sm text-white/55">{formatDate(tournament.start_date)}</p></div></Link> : <p className="mt-16 text-white/40">No tournament data available.</p>}
          </article>
          </Reveal>
        </div>
      </section>

      <section className="pr-cta border-t border-white/15">
        <Reveal className="pr-container grid gap-12 py-20 md:grid-cols-[1.2fr_.8fr] md:items-end md:py-24">
          <h2 className="pr-cta-title text-[clamp(3.2rem,6vw,6.5rem)] font-semibold leading-[.86] tracking-[-.065em]">DON&apos;T FOLLOW<br />THE NOISE.<br />READ THE GAME.</h2>
          <div><p className="pr-cta-copy max-w-md text-base leading-7">Compare teams and players with performance context, recent form and competitive history in one view.</p><Link href="/compare" className="pr-cta-button mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 text-xs font-black uppercase tracking-[.16em]">Start comparing <ArrowRight size={16} /></Link></div>
        </Reveal>
      </section>
    </main>
  );
}
