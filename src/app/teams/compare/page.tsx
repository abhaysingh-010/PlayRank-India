import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TeamCompareSelector from "@/components/TeamCompareSelector";

type TeamOption = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  logo_url: string | null;
  country: string | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
  global_rank: number | null;
  verified: boolean | null;
};

const surface =
  "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel =
  "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function shortNumber(value: number | null | undefined) {
  const safeValue = Number(value || 0);

  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(1)}k`;
  }

  return Math.round(safeValue).toString();
}

function rankTone(rank: number | null | undefined) {
  if (!rank) return "border-white/10 bg-white/[0.04] text-white/60";
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  return "border-white/10 bg-white/[0.04] text-white/70";
}

function TeamLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.12] bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-sm font-black text-white/70">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[1.05rem] border border-white/[0.10] bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-lg font-black ${
          highlight
            ? "bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TeamPreviewCard({ team }: { team: TeamOption }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group relative block overflow-hidden rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.055]"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10 flex items-center gap-3">
        <TeamLogo name={team.name} logoUrl={team.logo_url} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${rankTone(
                team.global_rank
              )}`}
            >
              {team.global_rank ? `#${team.global_rank}` : "—"}
            </span>

            {team.verified ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Verified
              </span>
            ) : null}
          </div>

          <p className="mt-2 truncate text-sm font-black text-white">
            {team.name}
          </p>

          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/35">
            {team.short_name || "TEAM"}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SuggestedDuel({
  firstTeam,
  secondTeam,
  label,
}: {
  firstTeam: TeamOption;
  secondTeam: TeamOption;
  label: string;
}) {
  return (
    <Link
      href={`/compare/teams/${firstTeam.slug}/${secondTeam.slug}`}
      className="group relative block overflow-hidden rounded-[1.5rem] border border-white/[0.10] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-white/[0.055]"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/70">
          {label}
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <TeamLogo
                name={firstTeam.name}
                logoUrl={firstTeam.logo_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {firstTeam.short_name || firstTeam.name}
                </p>
                <p className="text-xs text-white/35">
                  #{firstTeam.global_rank || "—"} · {shortNumber(firstTeam.points)} pts
                </p>
              </div>
            </div>
          </div>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/35">
            VS
          </span>

          <div className="min-w-0 text-right">
            <div className="flex flex-row-reverse items-center gap-3">
              <TeamLogo
                name={secondTeam.name}
                logoUrl={secondTeam.logo_url}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-black text-white">
                  {secondTeam.short_name || secondTeam.name}
                </p>
                <p className="text-xs text-white/35">
                  #{secondTeam.global_rank || "—"} · {shortNumber(secondTeam.points)} pts
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-sm text-white/45">Open team battle analysis</p>
          <span className="text-sm font-black text-emerald-300 transition group-hover:translate-x-1">
            Compare →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function CompareTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{
    team1?: string;
    team2?: string;
  }>;
}) {
  const params = await searchParams;

  if (params?.team1 && params?.team2 && params.team1 !== params.team2) {
    redirect(`/compare/teams/${params.team1}/${params.team2}`);
  }

  const { data } = await supabase
    .from("teams")
    .select(
      "id, name, slug, short_name, logo_url, country, points, wins, kills, matches_played, global_rank, verified"
    )
    .not("slug", "is", null)
    .order("global_rank", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  const teams = (data || []) as TeamOption[];

  if (teams.length < 2) {
    return (
      <main className="page-shell relative py-6 text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

        <section className={surface}>
          <div className="relative z-10 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/35">
              Team Compare
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
              Not enough team data
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
              At least two teams are required to open the Team Battle Analyzer.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const topTeams = teams
    .filter((team) => team.global_rank !== null)
    .slice(0, 8);

  const suggestedPairs = [
    {
      label: "Top-ranked clash",
      firstTeam: teams[0],
      secondTeam: teams[1],
    },
    {
      label: "Elite pressure test",
      firstTeam: teams[0],
      secondTeam: teams[4] || teams[1],
    },
    {
      label: "Top 10 duel",
      firstTeam: teams[2] || teams[0],
      secondTeam: teams[9] || teams[1],
    },
    {
      label: "Rising battle",
      firstTeam: teams[5] || teams[0],
      secondTeam: teams[6] || teams[1],
    },
  ].filter((pair) => pair.firstTeam && pair.secondTeam && pair.firstTeam.id !== pair.secondTeam.id);

  const selectorTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    slug: team.slug,
  }));

  return (
    <main className="page-shell relative space-y-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/35">
              PlayRank Team Intelligence
            </p>

            <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
              Team Battle Analyzer
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/48 md:text-base">
              Select any two teams and compare ranking strength, firepower,
              WWCD output, momentum, placement efficiency and matchup signals.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:min-w-[360px]">
            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Teams
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {teams.length}
              </p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Verified
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-300">
                {teams.filter((team) => team.verified).length}
              </p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Radar
              </p>
              <p className="mt-2 text-3xl font-black text-white">ON</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.10),transparent_34%)]" />

          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Select Teams
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Build a Team Duel
            </h2>
          </div>

          <div className="relative z-10 p-5">
            <TeamCompareSelector teams={selectorTeams} />
          </div>
        </section>

        <section className={surface}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.10),transparent_34%)]" />

          <div className="relative z-10 border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Official Teams
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Top Ranked Pool
            </h2>
          </div>

          <div className="relative z-10 grid gap-3 p-5 sm:grid-cols-2">
            {topTeams.map((team) => (
              <TeamPreviewCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      </section>

      <section className={surface}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.10),transparent_34%)]" />

        <div className="relative z-10 flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
              Suggested Duels
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              Quick Matchups
            </h2>
          </div>

          <p className="text-sm text-white/40">
            Fast entry into premium team comparison.
          </p>
        </div>

        <div className="relative z-10 grid gap-4 p-5 lg:grid-cols-2">
          {suggestedPairs.map((pair) => (
            <SuggestedDuel
              key={`${pair.firstTeam.id}-${pair.secondTeam.id}`}
              label={pair.label}
              firstTeam={pair.firstTeam}
              secondTeam={pair.secondTeam}
            />
          ))}
        </div>
      </section>
    </main>
  );
}