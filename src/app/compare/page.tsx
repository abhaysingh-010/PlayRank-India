import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

const surface = "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel = "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatCount(value: unknown) 
{
  return n(value).toLocaleString("en-IN");
}

function FeaturePill({ children }: { children: string }) 
{
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/50">{children}</span>
  );
}

function MiniMetric
(
  {
    label,
    value,
    accent = false,
  }
  : 
  {
    label: string;
    value: string | number;
    accent?: boolean;
  }
) 
{
  return (
    <div className={panel + " p-4"}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className={`mt-2 text-3xl font-black ${accent ? "text-[#ffd21a]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function CompareCard
(
  {
    href,
    label,
    title,
    description,
    accent,
    icon,
    metrics,
    primaryStat,
    secondaryStat,
  }
  : 
  {
    href: string;
    label: string;
    title: string;
    description: string;
    accent: "emerald" | "blue" | "yellow";
    icon: string;
    metrics: string[];
    primaryStat: string;
    secondaryStat: string;
  }
) 
{
  const glow = accent === "emerald"? "from-emerald-400/[0.16] via-emerald-400/[0.06] to-transparent" : accent === "blue"? "from-blue-400/[0.16] via-blue-400/[0.06] to-transparent" : "from-[#ffd21a]/[0.16] via-[#ffd21a]/[0.06] to-transparent";
  const text = accent === "emerald"? "text-emerald-300" : accent === "blue" ? "text-blue-300" : "text-[#ffd21a]";
  const border = accent === "emerald" ? "hover:border-emerald-300/30" : accent === "blue" ? "hover:border-blue-300/30" : "hover:border-[#ffd21a]/30";
  return (
    <Link href={href}className={`${surface} ${border} group block p-6 transition duration-300 hover:-translate-y-1`}>
      <div className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br ${glow} blur-3xl opacity-80 transition group-hover:opacity-100`}/>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${text}`}>{label}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">{title}</h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-black uppercase tracking-[0.14em] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {icon}
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">{description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Primary</p>
            <p className="mt-2 text-lg font-black text-white">{primaryStat}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Output</p>
            <p className="mt-2 text-lg font-black text-white">{secondaryStat}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {metrics.map
            ((metric) => 
              (
                <FeaturePill key={metric}>{metric}</FeaturePill>
              )
            )
          }
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
          <p className="text-sm font-semibold text-white/45">Open analyzer</p>
          <div className={`rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black ${text} transition group-hover:bg-white/[0.07]`}>
            Compare -&gt;
          </div>
        </div>
      </div>
    </Link>
  );
}

function UtilityCard
(
  {
    href,
    title,
    description,
    label,
  }
  : 
  {
    href: string;
    title: string;
    description: string;
    label: string;
  }
) 
{
  return (
    <Link href={href}className="rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.055]">
      <DataSourceBadge label={label} />
      <h3 className="mt-4 text-2xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#ffd21a]">Open -&gt;</p>
    </Link>
  );
}
export default async function ComparePage() 
{
  const 
  [
    teamsCountResult,
    playersCountResult,
    matchesCountResult,
    rankingsCountResult,
  ] 
  = await Promise.all
  (
    [
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("players").select("*", { count: "exact", head: true }),
      supabase.from("matches").select("*", { count: "exact", head: true }),
      supabase.from("rankings").select("*", { count: "exact", head: true }),
    ]
  );
  const teamsCount = teamsCountResult.count || 0;
  const playersCount = playersCountResult.count || 0;
  const matchesCount = matchesCountResult.count || 0;
  const rankingsCount = rankingsCountResult.count || 0;
  return (
    <main className="page-shell relative space-y-6 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">PlayRank Compare Center</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
              Compare
              <br />
              Intelligence
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/50 md:text-base">
              Compare teams and players using ranking strength, combat output,
              form, source-trusted records and PlayRank performance signals.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <DataSourceBadge label="Team Analyzer" />
              <DataSourceBadge label="Player Analyzer" />
              <DataSourceBadge label="Ranking Signals" />
              <DataSourceBadge label="Data Trust Layer" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric label="Teams" value={formatCount(teamsCount)} />
            <MiniMetric label="Players" value={formatCount(playersCount)} />
            <MiniMetric label="Matches" value={formatCount(matchesCount)} />
            <MiniMetric label="Ranks" value={formatCount(rankingsCount)} accent />
          </div>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <CompareCard href="/teams/compare"label="Team Mode"title="Team Battle Analyzer"description="Compare two teams across ranking score, WWCD output, kill pressure, match volume, roster strength and tournament performance context."accent="emerald"icon="TEAM"primaryStat={`${formatCount(teamsCount)} teams`}secondaryStat="Ranking + match signals"metrics={["Ranking Score","WWCD","Kills","Momentum","H2H","Radar Matrix",]}/>
        <CompareCard href="/players/compare"label="Player Mode"title="Player Duel Analyzer"description="Compare two players across fragging, damage output, clutch impact, role profile, MVP value and available match-stat history."accent="blue"icon="DUEL"primaryStat={`${formatCount(playersCount)} players`}secondaryStat="Damage + impact signals"metrics={["Kills","Damage","Knocks","MVP","Role Duel","Radar Matrix",]}/>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <UtilityCard href="/rankings"label="Ranking Layer"title="Ranking Context"description="Use current team and player rankings before starting a comparison. Useful for checking rank, score and movement."/>
        <UtilityCard href="/matches"label="Match Layer"title="Match Intelligence"description="Review match records, team outputs and promoted API match context before comparing teams or players."/>
        <UtilityCard href="/data"label="Trust Layer"title="Data Confidence"description="Understand which data is official, admin verified, staged, promoted or analytics generated inside PlayRank."/>
      </section>

      <section className="relative overflow-hidden rounded-[1.35rem] border border-[#ffd21a]/25 bg-gradient-to-br from-[#ffd21a]/[0.14] via-[#ffd21a]/[0.06] to-white/[0.03] p-6 shadow-[0_0_45px_rgba(250,204,21,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffd21a]/20 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-black text-white">Recommended first workflow</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Start with team comparison because team rankings, tournament
              standings and match results currently have the strongest coverage.
              Use player comparison next when player match stats are available.
            </p>
          </div>
          <Link href="/teams/compare"className="w-fit rounded-full border border-[#ffd21a]/30 bg-black/20 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-black/30">
            Start with teams
          </Link>
        </div>
      </section>
    </main>
  );
}