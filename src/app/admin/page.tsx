import Link from "next/link";
import { ArrowRight, CircleAlert, Database, Gauge, ShieldCheck, Workflow } from "lucide-react";

const groups = [
  { label:"System integrity", icon:Gauge, items:[
    ["Data health","Audit missing identity, logos, slugs and orphaned ranking records.","/admin/data-health","Check"],
    ["Roster health","Review team-player synchronization and promotion safety.","/admin/rosters/health","Check"],
    ["Ranking sync","Run protected recalculation and inspect ranking history.","/admin/rankings-sync","Action"],
  ]},
  { label:"PUBG pipeline", icon:Workflow, items:[
    ["Pipeline hub","Review the staging-to-promotion workflow.","/admin/pubg","Control"],
    ["Import match","Stage a PUBG API match without touching public tables.","/admin/pubg/import","Write"],
    ["Import review","Inspect imports, readiness and blocked promotions.","/admin/pubg/imports","Review"],
    ["Identity mappings","Connect PUBG accounts to verified PlayRank entities.","/admin/pubg/mappings","Write"],
  ]},
  { label:"Content operations", icon:Database, items:[
    ["Teams","Manage team identity, logos and source metadata.","/admin/teams","Manage"],
    ["Players","Manage player identity, roles and team links.","/admin/players","Manage"],
    ["Rosters","Maintain active roster records and synchronization.","/admin/rosters","Manage"],
    ["Matches","Manage structured competitive match records.","/admin/matches","Manage"],
    ["Tournaments","Maintain event metadata and competition coverage.","/admin/tournaments","Manage"],
  ]},
];

export default function AdminPage(){
  const modules=groups.reduce((sum,group)=>sum+group.items.length,0);
  return <main className="mx-auto max-w-[1500px] px-5 py-10">
    <section className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[var(--pr-red)]">Operations overview</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">Control the data layer.</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-white/45">Monitor integrity, stage external records, resolve identity, and promote only data that is safe for the public PlayRank experience.</p></div>
      <div className="grid grid-cols-3 border border-white/10"><Metric value={modules} label="Modules"/><Metric value="Protected" label="Access"/><Metric value="Staged" label="API writes"/></div>
    </section>
    <section className="grid gap-6 py-8 xl:grid-cols-3">{groups.map((group)=><ModuleGroup key={group.label} {...group}/>)}</section>
    <section className="grid gap-5 border-y border-white/10 py-8 md:grid-cols-[auto_1fr_auto] md:items-center"><CircleAlert size={18} className="text-[var(--pr-gold)]"/><div><p className="text-sm font-semibold">Promotion safety rule</p><p className="mt-1 text-xs leading-6 text-white/35">Raw imports must pass identity mapping and roster checks before reaching public core tables.</p></div><Link href="/data" className="text-[10px] font-black uppercase tracking-[.15em] text-white/35 hover:text-white">Public trust page</Link></section>
  </main>;
}

function Metric({value,label}:{value:string|number;label:string}){return <div className="border-r border-white/10 p-4 last:border-r-0"><p className="truncate text-lg font-semibold">{value}</p><p className="mt-2 text-[8px] uppercase tracking-[.14em] text-white/25">{label}</p></div>;}
function ModuleGroup({label,icon:Icon,items}:{label:string;icon:typeof ShieldCheck;items:string[][]}){return <section className="border border-white/10 bg-white/[.018]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><Icon size={16} className="text-[var(--pr-red)]"/><h2 className="text-xs font-black uppercase tracking-[.14em]">{label}</h2></div><span className="text-[9px] text-white/25">{items.length} modules</span></div><div>{items.map(([title,description,href,status])=><Link key={href} href={href} className="group grid grid-cols-[1fr_auto] gap-5 border-b border-white/[.07] p-5 last:border-b-0 hover:bg-white/[.025]"><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/35">{description}</p></div><div className="text-right"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[var(--pr-gold)]">{status}</span><ArrowRight size={13} className="ml-auto mt-4 text-white/20 group-hover:text-[var(--pr-red)]"/></div></Link>)}</div></section>;}
