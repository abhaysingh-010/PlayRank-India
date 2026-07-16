import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck, Trophy } from "lucide-react";
import RankHistoryChart from "@/components/RankHistoryChart";
import { Reveal } from "@/components/home/HomeMotion";
import { supabase } from "@/lib/supabase";

type Team = { id:string; name:string; short_name:string|null; slug:string; country:string|null; logo_url:string|null; points:number|null; kills:number|null; wins:number|null; matches_played:number|null; global_rank:number|null; source:string|null; source_url:string|null; verified:boolean|null; active:boolean|null; created_at:string|null };
type Player = { id:string; ign:string; slug:string; role:string|null; kd_ratio:number|null; avg_damage:number|null; total_kills:number|null; recent_form:string|null };
type Achievement = { id:string; title:string; tournament_name:string|null; placement:string|null; year:number|null };
type History = { id:string; entity_type:string; entity_id:string; rank:number; score:number; snapshot_date:string; created_at:string|null };
type Ranking = { rank:number; score:number; change:number|null; updated_at:string|null };
type Match = { id:string; winner_team_id:string|null; team1_score:number|null; team2_score:number|null; map_name:string|null; stage:string|null; date:string|null; team1:{name:string}[]; team2:{name:string}[] };

function num(value: unknown) { const result = Number(value); return Number.isFinite(result) ? result : 0; }
function initials(value:string) { return value.split(" ").filter(Boolean).slice(0,2).map((part)=>part[0]).join("").toUpperCase(); }
function formatDate(value?:string|null) { return value ? new Date(value).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Not available"; }
function sourceLabel(source:string|null) { if(source==="krafton_india_esports") return "Official Krafton"; if(source==="pubg_api") return "PUBG API"; if(source==="admin_manual") return "Admin verified"; return source || "PlayRank"; }
function change(value?:number|null) { if(!value) return "Stable"; return value > 0 ? `Up ${value}` : `Down ${Math.abs(value)}`; }

export default async function TeamPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const { data: rawTeam } = await supabase.from("teams").select("*").eq("slug",slug).single();
  const team = rawTeam as Team|null;
  if(!team) return <main className="pr-container py-20"><p className="pr-kicker">404</p><h1 className="mt-4 text-5xl font-semibold text-white">Team not found.</h1><Link href="/teams" className="mt-8 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft size={15}/> Back to teams</Link></main>;

  const [rankingResult, achievementsResult, playersResult, matchesResult, historyResult] = await Promise.all([
    supabase.from("rankings").select("rank,score,change,updated_at").eq("entity_type","team").eq("entity_id",team.id).maybeSingle(),
    supabase.from("team_achievements").select("*").eq("team_id",team.id).order("year",{ascending:false}),
    supabase.from("players").select("id,ign,slug,role,kd_ratio,avg_damage,total_kills,recent_form").eq("team_id",team.id).order("ign",{ascending:true}),
    supabase.from("matches").select("id,winner_team_id,team1_score,team2_score,map_name,stage,date,team1:team1_id(name),team2:team2_id(name)").or(`team1_id.eq.${team.id},team2_id.eq.${team.id}`).order("date",{ascending:false}).limit(5),
    supabase.from("ranking_history").select("*").eq("entity_type","team").eq("entity_id",team.id).order("snapshot_date",{ascending:true}),
  ]);
  const ranking = rankingResult.data as Ranking|null;
  const achievements = (achievementsResult.data||[]) as Achievement[];
  const players = (playersResult.data||[]) as Player[];
  const matches = (matchesResult.data||[]) as Match[];
  const history = (historyResult.data||[]) as History[];
  const wins = num(team.wins), kills = num(team.kills), played = num(team.matches_played);
  const rank = ranking?.rank || team.global_rank || 0;
  const score = num(ranking?.score ?? team.points);
  const winRate = played ? Math.round(wins/played*100) : 0;
  const killsPerMatch = played ? (kills/played).toFixed(1) : "0.0";
  const recentWins = matches.filter((match)=>match.winner_team_id===team.id).length;

  return <main className="bg-[var(--pr-bg)] text-white">
    <section className="border-b border-white/15"><div className="pr-container py-12 md:py-18"><Link href="/teams" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 hover:text-white"><ArrowLeft size={13}/> Team directory</Link><div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div className="flex flex-col gap-7 sm:flex-row sm:items-end"><TeamMark team={team}/><div><p className="pr-kicker">Team dossier · {team.country||"India"}</p><h1 className="mt-4 max-w-5xl text-[clamp(3.7rem,8vw,8rem)] font-semibold uppercase leading-[.8] tracking-[-.075em]">{team.name}</h1><p className="mt-5 text-xs font-bold uppercase tracking-[.17em] text-white/35">{team.short_name||"Team"} · {sourceLabel(team.source)} · {team.active===false?"Inactive":"Active"}</p></div></div><div className="flex gap-3"><Link href={`/teams/compare?team1=${team.slug}`} className="pr-button pr-button-primary text-[10px]">Compare team</Link><Link href="/rankings/teams" className="pr-button pr-button-secondary text-[10px]">Rankings</Link></div></div></div></section>

    <section className="border-b border-white/15"><div className="pr-container grid grid-cols-2 md:grid-cols-6">{[[rank?`#${rank}`:"—","Rank"],[Math.round(score),"Score"],[change(ranking?.change),"Movement"],[wins,"Wins"],[killsPerMatch,"Kills / match"],[`${winRate}%`,"Win rate"]].map(([value,label])=><div key={label} className="border-r border-white/15 px-4 py-7 first:border-l"><p className="text-xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/28">{label}</p></div>)}</div></section>

    <section className="pr-container grid gap-12 py-18 lg:grid-cols-[1.15fr_.85fr]">
      <Reveal><div><p className="pr-kicker">Ranking trajectory</p><div className="mt-5 border-y border-white/15 py-6">{history.length?<RankHistoryChart history={history}/>:<p className="py-16 text-sm text-white/35">Ranking history will appear after the next snapshot.</p>}</div><p className="mt-4 text-xs leading-6 text-white/35">Latest ranking update: {formatDate(ranking?.updated_at||history.at(-1)?.snapshot_date)}</p></div></Reveal>
      <Reveal delay={.08}><div><p className="pr-kicker">Competitive read</p><h2 className="mt-5 text-4xl font-semibold tracking-[-.055em]">{rank&&rank<=10?"A front-running roster.":winRate>=25?"A team building momentum.":"A developing competitive record."}</h2><p className="mt-5 text-sm leading-7 text-white/45">{team.name} has recorded {wins} wins and {kills} kills across {played} tracked matches. The current record produces a {winRate}% win rate with {killsPerMatch} kills per match.</p><div className="mt-8 grid grid-cols-2 border border-white/15"><Insight value={`${recentWins}/${matches.length}`} label="Recent wins"/><Insight value={players.length} label="Roster size"/><Insight value={achievements.length} label="Achievements"/><Insight value={team.verified?"Verified":"Recorded"} label="Data status"/></div></div></Reveal>
    </section>

    <section className="border-y border-white/15 bg-[var(--pr-surface)]"><div className="pr-container py-16"><div className="flex items-end justify-between border-b border-white/15 pb-7"><div><p className="pr-kicker">Active roster</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em]">The lineup.</h2></div><p className="text-xs text-white/30">{players.length} players</p></div><div className="grid md:grid-cols-2">{players.length?players.map((player)=><Link key={player.id} href={`/players/${player.slug}`} className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 border-b border-white/10 py-5 md:odd:border-r md:odd:pr-7 md:even:pl-7"><div className="flex h-12 w-12 items-center justify-center border border-white/15 text-xs font-black text-white/55">{initials(player.ign)}</div><div><p className="font-semibold">{player.ign}</p><p className="mt-1 text-[9px] uppercase tracking-[.15em] text-white/25">{player.role||"Player"}</p></div><div className="text-right"><p className="text-sm font-semibold">{player.total_kills||0} kills</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">KD {player.kd_ratio||0}</p></div></Link>):<p className="py-12 text-white/35">No roster data is available yet.</p>}</div></div></section>

    <section className="pr-container grid gap-12 py-18 lg:grid-cols-2"><div><div className="flex items-center justify-between border-b border-white/15 pb-6"><div><p className="pr-kicker">Recent form</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Last five.</h2></div><Link href="/matches" className="text-white/30 hover:text-white"><ArrowUpRight size={18}/></Link></div>{matches.length?matches.map((match)=><Link key={match.id} href={`/match/${match.id}`} className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-white/10 py-5"><span className={`flex h-9 w-9 items-center justify-center border text-xs font-black ${match.winner_team_id===team.id?"border-[var(--pr-gold)] text-[var(--pr-gold)]":"border-white/15 text-white/35"}`}>{match.winner_team_id===team.id?"W":"L"}</span><div><p className="font-semibold">{match.team1?.[0]?.name||"Team"} vs {match.team2?.[0]?.name||"Team"}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">{match.stage||"Match"} · {match.map_name||"Map"} · {formatDate(match.date)}</p></div><ArrowRight size={14} className="text-white/20 group-hover:text-[var(--pr-red)]"/></Link>):<p className="py-10 text-white/35">No recent matches found.</p>}</div><div><div className="flex items-center justify-between border-b border-white/15 pb-6"><div><p className="pr-kicker">Honours</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Achievements.</h2></div><Trophy size={19} className="text-[var(--pr-gold)]"/></div>{achievements.length?achievements.slice(0,5).map((item)=><div key={item.id} className="grid grid-cols-[1fr_auto] gap-5 border-b border-white/10 py-5"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-white/35">{item.tournament_name||"Tournament"}</p></div><div className="text-right"><p className="font-semibold text-[var(--pr-gold)]">{item.placement||"Placed"}</p><p className="mt-1 text-xs text-white/30">{item.year||"—"}</p></div></div>):<p className="py-10 text-white/35">No achievements recorded yet.</p>}</div></section>

    <section className="pr-container pb-18"><div className="grid gap-6 border-y border-white/15 py-8 md:grid-cols-[auto_1fr] md:items-start"><ShieldCheck size={20} className="text-[var(--pr-red)]"/><p className="max-w-4xl text-sm leading-7 text-white/40">This dossier combines the latest ranking snapshot with available team, roster, achievement and match records. Source: {sourceLabel(team.source)}. PlayRank analytics are independent competitive intelligence and not outcome predictions.</p></div></section>
  </main>;
}

function TeamMark({team}:{team:Team}) { return <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">{team.logo_url?<Image src={team.logo_url} alt={`${team.name} logo`} width={112} height={112} className="h-full w-full object-contain p-3"/>:<span className="text-xl font-black text-white/60">{initials(team.name)}</span>}</div>; }
function Insight({value,label}:{value:string|number;label:string}) { return <div className="border-b border-r border-white/15 p-5"><p className="text-xl font-semibold">{value}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">{label}</p></div>; }
