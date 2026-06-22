import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TeamMini = {
  name: string;
  slug: string;
};

type MatchRow = {
  id: string;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1_score: number | null;
  team2_score: number | null;
  team1: TeamMini | null;
  team2: TeamMini | null;
  winner: TeamMini | null;
};

type MatchRowRaw = Omit<MatchRow, "team1" | "team2" | "winner"> & {
  team1: TeamMini[] | null;
  team2: TeamMini[] | null;
  winner: TeamMini[] | null;
};

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function formatDate(value: string | null) {
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Metric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div className={softCard + " p-4"}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          muted ? "text-white/65" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TeamBadge({
  team,
  align = "left",
  won = false,
}: {
  team: TeamMini | null;
  align?: "left" | "right";
  won?: boolean;
}) {
  const teamName = team?.name || "Team N/A";

  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
          won
            ? "border-[#ffd21a]/30 bg-[#ffd21a]/10 text-[#ffd21a]"
            : "border-white/10 bg-white/[0.04] text-white/65"
        }`}
      >
        <span className="text-sm font-black">{getInitials(teamName)}</span>
      </div>

      <div className="min-w-0">
        <p className="truncate font-black text-white">{teamName}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/30">
          {won ? "Winner" : "Team"}
        </p>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchRow }) {
  const team1Score = n(match.team1_score);
  const team2Score = n(match.team2_score);

  const team1Won =
    Boolean(match.winner?.slug) && match.winner?.slug === match.team1?.slug;

  const team2Won =
    Boolean(match.winner?.slug) && match.winner?.slug === match.team2?.slug;

  return (
    <Link
      href={`/match/${match.id}`}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.035]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.08),transparent_30%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
              {match.stage || "Match"}
            </p>
            <p className="mt-1 text-sm text-white/35">
              {match.map_name || "Map N/A"}
            </p>
          </div>

          <p className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-white/45">
            {formatDate(match.date)}
          </p>
        </div>

        <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
          <TeamBadge team={match.team1} won={team1Won} />

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-center">
            <p className="text-3xl font-black tracking-tight text-white">
              <span className={team1Won ? "text-[#ffd21a]" : ""}>
                {team1Score}
              </span>
              <span className="px-3 text-white/20">:</span>
              <span className={team2Won ? "text-[#ffd21a]" : ""}>
                {team2Score}
              </span>
            </p>

            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/30">
              Scoreline
            </p>
          </div>

          <TeamBadge team={match.team2} align="right" won={team2Won} />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Winner
            </p>

            <p className="mt-1 font-black text-[#ffd21a]">
              {match.winner?.name || "Pending"}
            </p>
          </div>

          <span className="text-sm font-black text-white/45 transition group-hover:text-[#ffd21a]">
            View match →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function MatchesPage() {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      map_name,
      stage,
      date,
      team1_score,
      team2_score,
      team1:team1_id (
        name,
        slug
      ),
      team2:team2_id (
        name,
        slug
      ),
      winner:winner_team_id (
        name,
        slug
      )
    `
    )
    .order("date", { ascending: false });

  if (error) {
    return (
      <main className="page-shell py-10">
        <section className={card + " p-8"}>
          <h1 className="text-2xl font-black text-white">Match Center</h1>
          <p className="mt-3 text-red-300">
            Failed to load matches. Check Supabase query, table permissions, or
            selected columns.
          </p>
        </section>
      </main>
    );
  }

  const rawMatches = (data || []) as MatchRowRaw[];
  const matches = rawMatches.map((match) => ({
    ...match,
    team1: match.team1?.[0] ?? null,
    team2: match.team2?.[0] ?? null,
    winner: match.winner?.[0] ?? null,
  })) as MatchRow[];

  const completedMatches = matches.filter(
    (match) => match.team1_score !== null && match.team2_score !== null
  ).length;

  const totalMaps = new Set(
    matches.map((match) => match.map_name).filter(Boolean)
  ).size;

  const totalStages = new Set(
    matches.map((match) => match.stage).filter(Boolean)
  ).size;

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              PlayRank Match Center
            </p>

            <h1 className="mt-2 max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">
              Match Intelligence
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/45">
              Explore completed matches, winners, maps, stages and performance
              signals across PlayRank.
            </p>
          </div>

          <Link
            href="/compare"
            className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
          >
            Compare Center
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Matches" value={matches.length} />
        <Metric label="Completed" value={completedMatches} />
        <Metric label="Maps" value={totalMaps || "—"} muted />
        <Metric label="Stages" value={totalStages || "—"} muted />
      </section>

      <section className={card + " p-6"}>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Matches
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Recent Matches
            </h2>
          </div>

          <p className="text-sm text-white/35">{matches.length} matches</p>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No matches available yet.
          </p>
        )}
      </section>
    </main>
  );
}