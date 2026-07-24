import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  MapPinned,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  slug: string;
  source_url: string | null;
};

type Match = {
  id: string;
  match_number: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  source_url: string | null;
  verified: boolean | null;
};

type Result = {
  id: string;
  match_id: string;
  team_id: string;
  placement: number | null;
  kills: number | null;
  placement_points: number | null;
  kill_points: number | null;
  total_points: number | null;
};

type Team = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type StageStanding = {
  teamId: string;
  maps: number;
  wins: number;
  kills: number;
  placementPoints: number;
  points: number;
  rank: number;
};

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

async function fetchAllResults(matchIds: string[]) {
  if (!matchIds.length) return [] as Result[];
  const rows: Result[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("team_match_results")
      .select(
        "id,match_id,team_id,placement,kills,placement_points,kill_points,total_points",
      )
      .in("match_id", matchIds)
      .order("match_id", { ascending: true })
      .order("placement", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data || []) as Result[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}

export default async function TournamentStagePage({
  params,
}: {
  params: Promise<{ slug: string; stage: string }>;
}) {
  const { slug, stage: stageSlug } = await params;
  const { data: rawTournament, error } = await supabase
    .from("tournaments")
    .select("id,name,slug,source_url")
    .eq("slug", slug)
    .single();

  if (error || !rawTournament) notFound();
  const tournament = rawTournament as Tournament;

  const { data: allStageRows, error: stageError } = await supabase
    .from("matches")
    .select("stage")
    .eq("tournament_id", tournament.id);
  if (stageError) throw stageError;

  const availableNames = [
    ...new Set((allStageRows || []).map((row) => row.stage || "Main Event")),
  ];
  if (tournament.slug === "battlegrounds-mobile-india-pro-series-2026")
    availableNames.push("Qualifiers");
  const stageName = availableNames.find((name) => slugify(name) === stageSlug);
  if (!stageName) notFound();

  const { data: rawMatches, error: matchError } = await supabase
    .from("matches")
    .select("id,match_number,map_name,stage,date,source_url,verified")
    .eq("tournament_id", tournament.id)
    .eq("stage", stageName)
    .order("date", { ascending: true })
    .order("match_number", { ascending: true });
  if (matchError) throw matchError;

  const matches = (rawMatches || []) as Match[];
  const results = await fetchAllResults(matches.map((match) => match.id));
  const teamIds = [...new Set(results.map((result) => result.team_id))];
  const teamResponse = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name,slug,logo_url")
        .in("id", teamIds)
    : { data: [], error: null };
  if (teamResponse.error) throw teamResponse.error;

  const teamById = new Map(
    ((teamResponse.data || []) as Team[]).map((team) => [team.id, team]),
  );
  const resultsByMatch = new Map<string, Result[]>();
  const standingByTeam = new Map<string, Omit<StageStanding, "rank">>();

  for (const result of results) {
    const matchRows = resultsByMatch.get(result.match_id) || [];
    matchRows.push(result);
    resultsByMatch.set(result.match_id, matchRows);

    const current = standingByTeam.get(result.team_id) || {
      teamId: result.team_id,
      maps: 0,
      wins: 0,
      kills: 0,
      placementPoints: 0,
      points: 0,
    };
    current.maps += 1;
    current.wins += number(result.placement) === 1 ? 1 : 0;
    current.kills += number(result.kills);
    current.placementPoints += number(result.placement_points);
    current.points += number(result.total_points);
    standingByTeam.set(result.team_id, current);
  }

  const standings: StageStanding[] = [...standingByTeam.values()]
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.kills - a.kills)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const totalKills = results.reduce(
    (sum, result) => sum + number(result.kills),
    0,
  );

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="relative overflow-hidden border-b border-white/15">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(244,62,52,.17),transparent_32%)]" />
        <div className="pr-container relative py-12 md:py-20">
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 hover:text-white"
          >
            <ArrowLeft size={13} /> {tournament.name}
          </Link>
          <p className="pr-kicker mt-14">Tournament stage</p>
          <h1 className="mt-5 max-w-6xl text-[clamp(4rem,9vw,9rem)] font-semibold uppercase leading-[.8] tracking-[-.075em]">
            {stageName}
          </h1>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-white/40">
            Stage leaderboard and every verified map result recorded for{" "}
            {tournament.name}.
          </p>
        </div>
      </section>

      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-4">
          {[
            [matches.length, "Maps"],
            [standings.length, "Teams"],
            [totalKills, "Kills"],
            [matches.length ? "Verified" : "Pending", "Coverage"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l"
            >
              <p className="text-xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.14em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-container py-16">
        <div className="flex items-end justify-between border-b border-white/15 pb-8">
          <div>
            <p className="pr-kicker">Stage table</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Stage standings.
            </h2>
          </div>
          <Trophy size={28} className="text-[var(--pr-gold)]" />
        </div>
        {standings.length ? (
          standings.map((row) => {
            const team = teamById.get(row.teamId);
            return (
              <Link
                key={row.teamId}
                href={team ? `/teams/${team.slug}` : "#"}
                className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-white/10 py-5 md:grid-cols-[64px_1.4fr_repeat(4,.6fr)]"
              >
                <span
                  className={
                    row.rank <= 3
                      ? "text-xl font-semibold text-[var(--pr-gold)]"
                      : "text-xl font-semibold text-white/35"
                  }
                >
                  {String(row.rank).padStart(2, "0")}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo team={team} />
                  <span className="truncate font-semibold">
                    {team?.name || "Unknown team"}
                  </span>
                </div>
                <Stat value={row.points} label="Points" />
                <Stat value={row.kills} label="Kills" desktop />
                <Stat value={row.wins} label="Wins" desktop />
                <Stat value={row.maps} label="Maps" desktop />
              </Link>
            );
          })
        ) : (
          <EmptyState
            text={`${stageName} belongs to this tournament, but verified map-level results are not available yet.`}
          />
        )}
      </section>

      <section className="border-t border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-16">
          <p className="pr-kicker">Map archive</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            All {stageName} maps.
          </h2>
          {matches.length ? (
            <div className="mt-10 grid gap-px overflow-hidden border border-white/15 bg-white/10 lg:grid-cols-2">
              {matches.map((match, index) => (
                <MapCard
                  key={match.id}
                  match={match}
                  fallbackNumber={index + 1}
                  results={resultsByMatch.get(match.id) || []}
                  teamById={teamById}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState text="No verified maps have been published for this stage." />
            </div>
          )}
        </div>
      </section>

      <section className="pr-container py-12">
        <div className="grid gap-5 border-y border-white/15 py-8 md:grid-cols-[auto_1fr]">
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            This page uses verified map-level team results. Missing stage data
            is labelled and never estimated.
          </p>
        </div>
      </section>
    </main>
  );
}

function MapCard({
  match,
  fallbackNumber,
  results,
  teamById,
}: {
  match: Match;
  fallbackNumber: number;
  results: Result[];
  teamById: Map<string, Team>;
}) {
  const sorted = [...results].sort(
    (a, b) => number(a.placement) - number(b.placement),
  );
  const winner = sorted[0] ? teamById.get(sorted[0].team_id) : undefined;
  return (
    <details className="group bg-[var(--pr-surface)] open:bg-white/[.04]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-6 marker:hidden">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/15 text-sm font-semibold text-white/45">
          {String(match.match_number || fallbackNumber).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{match.map_name || "Map TBD"}</p>
            {match.verified ? (
              <CheckCircle2 size={13} className="text-emerald-400" />
            ) : null}
          </div>
          <p className="mt-2 truncate text-[9px] uppercase tracking-[.13em] text-white/30">
            {formatDate(match.date)} · Winner {winner?.name || "TBD"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className="text-white/25 transition group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-white/10 px-6 pb-6">
        <div className="grid grid-cols-[40px_1fr_repeat(3,52px)] gap-3 py-4 text-[8px] font-black uppercase tracking-[.12em] text-white/25">
          <span>#</span>
          <span>Team</span>
          <span>K</span>
          <span>PP</span>
          <span>Total</span>
        </div>
        {sorted.map((row) => {
          const team = teamById.get(row.team_id);
          return (
            <div
              key={row.id}
              className="grid grid-cols-[40px_1fr_repeat(3,52px)] items-center gap-3 border-t border-white/10 py-3 text-sm"
            >
              <span
                className={
                  number(row.placement) <= 3
                    ? "font-semibold text-[var(--pr-gold)]"
                    : "text-white/35"
                }
              >
                {String(row.placement || 0).padStart(2, "0")}
              </span>
              <Link
                href={team ? `/teams/${team.slug}` : "#"}
                className="truncate font-semibold hover:text-[var(--pr-red)]"
              >
                {team?.name || "Unknown team"}
              </Link>
              <span>{number(row.kills)}</span>
              <span>{number(row.placement_points)}</span>
              <span className="font-semibold">{number(row.total_points)}</span>
            </div>
          );
        })}
        {match.source_url ? (
          <a
            href={match.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/30 hover:text-white"
          >
            Map source <ArrowUpRight size={12} />
          </a>
        ) : null}
      </div>
    </details>
  );
}

function TeamLogo({ team }: { team?: Team }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[.025]">
      {team?.logo_url ? (
        <Image
          src={team.logo_url}
          alt={`${team.name} logo`}
          width={44}
          height={44}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <Trophy size={15} className="text-white/20" />
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  desktop = false,
}: {
  value: number;
  label: string;
  desktop?: boolean;
}) {
  return (
    <div className={desktop ? "hidden md:block" : "text-right md:text-left"}>
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-[8px] uppercase tracking-[.12em] text-white/25">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-44 place-items-center border border-white/15 p-8 text-center">
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15">
          <MapPinned size={17} className="text-white/30" />
        </div>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/35">
          {text}
        </p>
      </div>
    </div>
  );
}
