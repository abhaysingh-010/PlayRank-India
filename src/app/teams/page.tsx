import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Minus,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Ranking = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};
type Team = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  logo_url: string | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};
const PAGE_SIZE = 10;
function pageNumber(value?: string) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
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
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">
      {team.logo_url ? (
        <Image
          src={team.logo_url}
          alt={`${team.name} logo`}
          width={56}
          height={56}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-xs font-black text-white/55">
          {initials(team.name)}
        </span>
      )}
    </div>
  );
}
function Movement({ value }: { value: number | null }) {
  if (!value)
    return (
      <span className="inline-flex items-center gap-1 text-white/30">
        <Minus size={13} /> 0
      </span>
    );
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-[var(--pr-positive)]">
        <ArrowUp size={13} /> {value}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[var(--pr-red)]">
      <ArrowDown size={13} /> {Math.abs(value)}
    </span>
  );
}

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = pageNumber(params.page),
    offset = (page - 1) * PAGE_SIZE;
  const [rankingResult, snapshotResult, teamCountResult] = await Promise.all([
    supabase
      .from("rankings")
      .select("entity_id,rank,score,change,updated_at", { count: "exact" })
      .eq("entity_type", "team")
      .order("rank", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("ranking_history")
      .select("snapshot_date,created_at")
      .eq("entity_type", "team")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("teams").select("*", { count: "exact", head: true }),
  ]);
  const rankings = (rankingResult.data || []) as Ranking[];
  const ids = rankings.map((row) => row.entity_id);
  const teamsResult = ids.length
    ? await supabase
        .from("teams")
        .select(
          "id,name,short_name,slug,country,logo_url,wins,kills,matches_played,source,verified,active",
        )
        .in("id", ids)
    : { data: [], error: null };
  if (rankingResult.error || teamsResult.error)
    return (
      <main className="pr-container py-20">
        <p className="pr-kicker">Data unavailable</p>
        <h1 className="mt-4 text-5xl font-semibold text-white">
          Teams could not be loaded.
        </h1>
      </main>
    );
  const teams = (teamsResult.data || []) as Team[],
    byId = new Map(teams.map((team) => [team.id, team]));
  const rows = rankings
    .map((ranking) => ({ ranking, team: byId.get(ranking.entity_id) }))
    .filter((item): item is { ranking: Ranking; team: Team } =>
      Boolean(item.team),
    );
  const total = rankingResult.count || 0,
    pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const snapshot =
    rankings[0]?.updated_at ||
    snapshotResult.data?.snapshot_date ||
    snapshotResult.data?.created_at ||
    null;

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="pr-kicker">Indian esports organisations</p>
            <h1 className="mt-5 text-[clamp(4.5rem,9vw,9rem)] font-semibold uppercase leading-[.78] tracking-[-.08em]">
              Team
              <br />
              <span className="text-[var(--pr-red)]">intelligence.</span>
            </h1>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-xl text-base leading-7 text-white/50">
              Explore every ranked organisation through verified identity,
              competitive position and available match performance.
            </p>
            <div className="mt-7 flex gap-3">
              <Link
                href="/teams/compare"
                className="pr-button pr-button-primary text-[10px]"
              >
                Compare teams
              </Link>
              <Link
                href="/rankings/teams"
                className="pr-button pr-button-secondary text-[10px]"
              >
                Team rankings
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-3">
          {[
            [total, "Ranked teams"],
            [teamCountResult.count || 0, "Team records"],
            [formatDate(snapshot), "Latest snapshot"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l md:px-8"
            >
              <p className="text-lg font-semibold tracking-[-.03em] md:text-2xl">
                {value}
              </p>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/28">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="pr-container py-16 md:py-22">
        <div className="flex flex-col gap-4 border-b border-white/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="pr-kicker">Directory · page {page}</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Ranked organisations.
            </h2>
          </div>
          <p className="text-xs uppercase tracking-[.15em] text-white/30">
            10 teams per page
          </p>
        </div>
        <div>
          {rows.length ? (
            rows.map(({ ranking, team }) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="pr-ranking-row group grid grid-cols-[46px_1fr_auto] items-center gap-3 border-b border-white/10 py-5 md:grid-cols-[66px_1.3fr_repeat(4,.55fr)_24px] md:gap-5"
              >
                <span
                  className={`text-2xl font-semibold ${ranking.rank <= 3 ? "text-[var(--pr-gold)]" : "text-white/40"}`}
                >
                  {String(ranking.rank).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 items-center gap-4">
                  <Mark team={team} />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {team.name}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
                      {team.short_name || "Team"} · {team.country || "India"}
                    </p>
                  </div>
                </div>
                <div className="text-right md:text-left">
                  <p className="font-semibold">{Math.round(ranking.score)}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
                    Score
                  </p>
                </div>
                <Stat
                  value={<Movement value={ranking.change} />}
                  label="Movement"
                />
                <Stat value={team.wins || 0} label="Wins" />
                <Stat value={team.matches_played || 0} label="Matches" />
                <Stat value={team.kills || 0} label="Kills" />
                <ArrowRight
                  size={15}
                  className="hidden text-white/20 group-hover:text-[var(--pr-red)] md:block"
                />
              </Link>
            ))
          ) : (
            <p className="py-14 text-white/35">
              No ranked teams found on this page.
            </p>
          )}
        </div>
        <nav
          className="mt-8 flex items-center justify-between border-t border-white/15 pt-7"
          aria-label="Team pages"
        >
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">
            Page {Math.min(page, pages)} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/teams?page=${page - 1}`}
                className="pr-button pr-button-secondary text-[10px]"
              >
                Previous 10
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={`/teams?page=${page + 1}`}
                className="pr-button pr-button-primary text-[10px]"
              >
                Next 10 <ArrowRight size={13} />
              </Link>
            ) : null}
          </div>
        </nav>
      </section>
      <section className="border-t border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container grid gap-6 py-12 md:grid-cols-[auto_1fr] md:items-start">
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            Directory order follows the latest available team ranking snapshot.
            Official and verified records are attributed where available;
            PlayRank structures this data independently for competitive
            analysis.
          </p>
        </div>
      </section>
    </main>
  );
}
function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="hidden md:block">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/25">
        {label}
      </p>
    </div>
  );
}
