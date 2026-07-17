import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Crown,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  slug: string;
  organizer: string | null;
  location: string | null;
  status: string | null;
  prize_pool: number | string | null;
  participating_teams: number | null;
  start_date: string | null;
  end_date: string | null;
  source_url: string | null;
  verified: boolean | null;
};

type Team = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  logo_url: string | null;
};

type Match = {
  id: string;
  stage: string | null;
};

type Standing = {
  team_id: string;
  matches_played: number;
  wins: number;
  kills: number;
  placement_points: number;
  kill_points: number;
  points: number;
  average_placement: number | string | null;
  rank: number;
};

const STAGE_ORDER = [
  "Qualifiers",
  "Survival Stage",
  "Semi Finals",
  "Last Chance",
  "Grand Finals",
];

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function formatMoney(value: unknown) {
  const amount = number(value);
  if (!amount) return "TBD";
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: rawTournament, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !rawTournament) notFound();
  const tournament = rawTournament as Tournament;

  const [matchResponse, standingResponse] = await Promise.all([
    supabase
      .from("matches")
      .select("id,stage")
      .eq("tournament_id", tournament.id),
    supabase
      .from("tournament_computed_standings")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("rank", { ascending: true }),
  ]);

  if (matchResponse.error) throw matchResponse.error;
  if (standingResponse.error) throw standingResponse.error;

  const matches = (matchResponse.data || []) as Match[];
  const standings = (standingResponse.data || []) as Standing[];
  const topTen = standings.slice(0, 10);

  const teamIds = topTen.map((row) => row.team_id);
  const teamResponse = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name,slug,short_name,logo_url")
        .in("id", teamIds)
    : { data: [], error: null };

  if (teamResponse.error) throw teamResponse.error;
  const teamById = new Map(
    ((teamResponse.data || []) as Team[]).map((team) => [team.id, team]),
  );

  const stageNames = new Set(
    matches.map((match) => match.stage || "Main Event"),
  );
  if (tournament.slug === "battlegrounds-mobile-india-pro-series-2026") {
    stageNames.add("Qualifiers");
  }

  const stages = [...stageNames]
    .sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a);
      const bi = STAGE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map((name) => ({
      name,
      count: matches.filter((match) => (match.stage || "Main Event") === name)
        .length,
    }));

  const totalKills = standings.reduce((sum, row) => sum + number(row.kills), 0);

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="relative overflow-hidden border-b border-white/15">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(244,62,52,.16),transparent_34%)]" />
        <div className="pr-container relative py-12 md:py-20">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 hover:text-white"
          >
            <ArrowLeft size={13} /> Tournament register
          </Link>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <p className="pr-kicker">
                {tournament.status || "Tournament"} ·{" "}
                {tournament.location || "India"}
              </p>
              <h1 className="mt-5 max-w-6xl text-[clamp(3.5rem,7.5vw,8rem)] font-semibold uppercase leading-[.8] tracking-[-.075em]">
                {tournament.name}
              </h1>
              <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-white/40">
                {tournament.organizer || "Organiser TBD"} ·{" "}
                {formatDate(tournament.start_date)} —{" "}
                {formatDate(tournament.end_date)}
              </p>
            </div>
            <div className="border border-white/15 bg-white/[.025] p-6">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">
                Event coverage
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-.04em]">
                {stages.length} stages
              </p>
              <p className="mt-2 text-sm text-white/40">
                {matches.length} verified map results
              </p>
              {tournament.source_url ? (
                <a
                  href={tournament.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[var(--pr-red)]"
                >
                  View source <ArrowUpRight size={13} />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-6">
          {[
            [formatMoney(tournament.prize_pool), "Prize pool"],
            [tournament.participating_teams || standings.length, "Teams"],
            [matches.length, "Maps"],
            [standings.length, "Ranked teams"],
            [totalKills, "Kills"],
            [tournament.verified ? "Verified" : "Recorded", "Status"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l"
            >
              <p className="truncate text-xl font-semibold">{value}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[.14em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-container py-20">
        <div className="text-center">
          <p className="pr-kicker">Overall standings</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Overall top ten.
          </h2>
        </div>

        {topTen.length >= 3 ? (
          <>
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-3 items-end gap-2 sm:gap-5">
              <PodiumPlace
                standing={topTen[1]}
                team={teamById.get(topTen[1].team_id)}
                place={2}
                label="Runner-up"
                height="h-44 md:h-60"
              />
              <PodiumPlace
                standing={topTen[0]}
                team={teamById.get(topTen[0].team_id)}
                place={1}
                label="Champion"
                height="h-56 md:h-[19rem]"
                champion
              />
              <PodiumPlace
                standing={topTen[2]}
                team={teamById.get(topTen[2].team_id)}
                place={3}
                label="Third place"
                height="h-36 md:h-52"
              />
            </div>

            <div className="mx-auto mt-10 max-w-5xl border-t border-white/15">
              {topTen.slice(3).map((standing) => {
                const team = teamById.get(standing.team_id);
                return (
                  <Link
                    key={standing.team_id}
                    href={team ? `/teams/${team.slug}` : "#"}
                    className="group grid grid-cols-[54px_1fr_auto_auto] items-center gap-4 border-b border-white/10 py-5 md:grid-cols-[70px_1fr_repeat(3,100px)_20px]"
                  >
                    <span className="text-xl font-semibold text-white/35">
                      {String(standing.rank).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 items-center gap-4">
                      <TeamLogo team={team} size="small" />
                      <span className="truncate font-semibold">
                        {team?.name || "Unknown team"}
                      </span>
                    </div>
                    <SmallStat value={standing.points} label="Points" />
                    <SmallStat
                      value={standing.kills}
                      label="Kills"
                      hideOnMobile
                    />
                    <SmallStat
                      value={standing.wins}
                      label="Wins"
                      hideOnMobile
                    />
                    <ArrowRight
                      size={14}
                      className="hidden text-white/20 transition group-hover:translate-x-1 group-hover:text-[var(--pr-red)] md:block"
                    />
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mt-12 border border-white/15 p-10 text-center text-sm text-white/35">
            Top-ten results are not available yet.
          </div>
        )}
      </section>

      <section className="border-y border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="pr-kicker">Tournament stages</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
                Enter the competition.
              </h2>
            </div>
            <span className="hidden text-[9px] font-black uppercase tracking-[.16em] text-white/25 md:block">
              Select a stage
            </span>
          </div>

          <div className="mt-10 overflow-hidden border border-white/15">
            {stages.map((stage, index) => (
              <Link
                key={stage.name}
                href={`/tournaments/${tournament.slug}/stages/${slugify(stage.name)}`}
                className="group grid min-h-24 grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-white/10 bg-[var(--pr-surface)] px-5 py-5 transition last:border-b-0 hover:bg-white/[.06] md:grid-cols-[80px_1fr_180px_44px] md:px-7"
              >
                <span className="text-sm font-semibold text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-.025em] md:text-2xl">
                    {stage.name}
                  </h3>
                  <p className="mt-2 text-[8px] font-black uppercase tracking-[.13em] text-white/25 md:hidden">
                    {stage.count ? `${stage.count} maps` : "Coverage pending"}
                  </p>
                </div>
                <p className="hidden text-[9px] font-black uppercase tracking-[.13em] text-white/30 md:block">
                  {stage.count
                    ? `${stage.count} verified maps`
                    : "Coverage pending"}
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition group-hover:border-[var(--pr-red)] group-hover:bg-[var(--pr-red)] group-hover:text-black">
                  <ArrowRight
                    size={15}
                    className="transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pr-container pb-16">
        <div className="grid gap-5 border-y border-white/15 py-8 md:grid-cols-[auto_1fr]">
          <ShieldCheck size={20} className="text-[var(--pr-red)]" />
          <p className="max-w-4xl text-sm leading-7 text-white/40">
            Rankings are computed from every verified team result stored for
            this tournament. Open a stage to inspect its own leaderboard and
            map-by-map results.
          </p>
        </div>
      </section>
    </main>
  );
}

function PodiumPlace({
  standing,
  team,
  place,
  label,
  height,
  champion = false,
}: {
  standing: Standing;
  team?: Team;
  place: number;
  label: string;
  height: string;
  champion?: boolean;
}) {
  return (
    <Link
      href={team ? `/teams/${team.slug}` : "#"}
      className="group text-center"
    >
      <div className="relative mx-auto mb-5 w-fit">
        {champion ? (
          <Crown
            size={25}
            className="absolute -top-9 left-1/2 -translate-x-1/2 text-[var(--pr-gold)]"
          />
        ) : null}
        <TeamLogo team={team} size="large" champion={champion} />
      </div>
      <p className="truncate px-1 text-sm font-semibold md:text-lg">
        {team?.name || "Unknown team"}
      </p>
      <p
        className={`mt-2 text-[8px] font-black uppercase tracking-[.15em] ${champion ? "text-[var(--pr-gold)]" : "text-white/30"}`}
      >
        {label}
      </p>
      <div
        className={`relative mt-5 flex ${height} flex-col items-center justify-between overflow-hidden border border-white/15 p-4 ${champion ? "bg-[var(--pr-red)] text-black" : "bg-white/[.04]"}`}
      >
        <span
          className={`text-[clamp(2.5rem,7vw,6rem)] font-semibold leading-none tracking-[-.08em] ${champion ? "text-black" : "text-white/15"}`}
        >
          0{place}
        </span>
        <div>
          <p className="text-xl font-semibold md:text-3xl">{standing.points}</p>
          <p
            className={`mt-1 text-[8px] uppercase tracking-[.13em] ${champion ? "text-black/55" : "text-white/25"}`}
          >
            Points
          </p>
        </div>
      </div>
    </Link>
  );
}

function TeamLogo({
  team,
  size,
  champion = false,
}: {
  team?: Team;
  size: "small" | "large";
  champion?: boolean;
}) {
  const dimensions =
    size === "large" ? "h-20 w-20 md:h-28 md:w-28" : "h-11 w-11";
  return (
    <div
      className={`flex ${dimensions} shrink-0 items-center justify-center overflow-hidden border ${champion ? "border-[var(--pr-gold)] bg-[var(--pr-gold)]/10" : "border-white/15 bg-white/[.025]"}`}
    >
      {team?.logo_url ? (
        <Image
          src={team.logo_url}
          alt={`${team.name} logo`}
          width={112}
          height={112}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <Trophy size={size === "large" ? 28 : 16} className="text-white/20" />
      )}
    </div>
  );
}

function SmallStat({
  value,
  label,
  hideOnMobile = false,
}: {
  value: number;
  label: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={hideOnMobile ? "hidden md:block" : "text-right md:text-left"}
    >
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-[8px] uppercase tracking-[.12em] text-white/25">
        {label}
      </p>
    </div>
  );
}
