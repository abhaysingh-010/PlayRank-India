import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";
import PublicTrustNotice from "@/components/PublicTrustNotice";

type TournamentRow = {
  id: string;
  name: string;
  slug: string;
  organizer: string | null;
  status: string | null;
  location: string | null;
  prize_pool: number | null;
  participating_teams: number | null;
  logo_url?: string | null;
  source: string | null;
  source_url: string | null;
  verified: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string | null;
};

type CountRow = {
  tournament_id: string | null;
};

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatPrizePool(value: unknown) {
  const amount = n(value);

  if (!amount) return "TBD";
  if (amount >= 10000000) return `â‚¹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `â‚¹${(amount / 100000).toFixed(1)}L`;

  return `â‚¹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function getStatusLabel(status: string | null) {
  return status || "Upcoming";
}

function getStatusClass(status: string | null) {
  const safeStatus = (status || "").toLowerCase();

  if (safeStatus.includes("live") || safeStatus.includes("ongoing")) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (safeStatus.includes("complete") || safeStatus.includes("ended")) {
    return "border-white/10 bg-white/[0.04] text-white/45";
  }

  if (safeStatus.includes("cancel")) {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-[#ffd21a]/25 bg-[#ffd21a]/10 text-[#ffd21a]";
}

function getSourceLabel(source: string | null, verified: boolean | null) {
  if (source === "krafton_india_esports") return "Official Krafton";
  if (source === "admin_manual") return "Admin Verified";
  if (verified) return "Verified Event";
  return "Tournament Record";
}

function countByTournament(rows: CountRow[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    if (!row.tournament_id) continue;
    map.set(row.tournament_id, (map.get(row.tournament_id) || 0) + 1);
  }

  return map;
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

function TournamentLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-sm font-black text-white/75">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white/75">{value}</p>
    </div>
  );
}

function TournamentCard({
  tournament,
  matchCount,
  standingCount,
}: {
  tournament: TournamentRow;
  matchCount: number;
  standingCount: number;
}) {
  const statusLabel = getStatusLabel(tournament.status);
  const sourceLabel = getSourceLabel(tournament.source, tournament.verified);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#090b10] p-5 transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.035]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.07),transparent_28%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <TournamentLogo
              name={tournament.name}
              logoUrl={tournament.logo_url}
            />

            <div className="min-w-0">
              <Link
                href={`/tournaments/${tournament.slug}`}
                className="line-clamp-1 text-lg font-black tracking-[-0.03em] text-white hover:underline"
              >
                {tournament.name}
              </Link>

              <p className="mt-1 truncate text-xs font-semibold text-white/40">
                {tournament.organizer || "Organizer TBD"}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${getStatusClass(
              tournament.status
            )}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <DataSourceBadge
            source={tournament.source}
            verified={tournament.verified}
            label={sourceLabel}
          />
        </div>

        <div className="mt-5 grid grid-cols-4 gap-4 border-y border-white/10 py-4">
          <MiniStat label="Prize" value={formatPrizePool(tournament.prize_pool)} />
          <MiniStat label="Teams" value={tournament.participating_teams || "â€”"} />
          <MiniStat label="Matches" value={matchCount} />
          <MiniStat label="Rows" value={standingCount} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white/40">
              {tournament.location || "India"}
            </p>

            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/25">
              Added {formatDate(tournament.created_at)}
            </p>
          </div>

          <Link
            href={`/tournaments/${tournament.slug}`}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/50 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function TournamentsPage() {
  const [tournamentsResult, matchesResult, standingsResult] = await Promise.all([
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase.from("matches").select("tournament_id"),

    supabase.from("tournament_standings").select("tournament_id"),
  ]);

  const tournaments = (tournamentsResult.data || []) as TournamentRow[];
  const matches = (matchesResult.data || []) as CountRow[];
  const standings = (standingsResult.data || []) as CountRow[];

  const matchesByTournament = countByTournament(matches);
  const standingsByTournament = countByTournament(standings);

  const liveTournaments = tournaments.filter((tournament) => {
    const status = (tournament.status || "").toLowerCase();
    return status.includes("live") || status.includes("ongoing");
  }).length;

  const completedTournaments = tournaments.filter((tournament) => {
    const status = (tournament.status || "").toLowerCase();
    return status.includes("complete") || status.includes("ended");
  }).length;

  const verifiedTournaments = tournaments.filter(
    (tournament) => tournament.verified === true
  ).length;

  const totalPrizePool = tournaments.reduce(
    (sum, tournament) => sum + n(tournament.prize_pool),
    0
  );

  if (tournamentsResult.error) {
    return (
      <main className="page-shell py-10">
        <section className={card + " p-8"}>
          <h1 className="text-2xl font-black text-white">Tournaments</h1>

          <p className="mt-3 text-red-300">
            Failed to load tournaments. Check Supabase query, table permissions,
            or selected columns.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              PlayRank Tournament Center
            </p>

            <h1 className="mt-2 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white md:text-7xl">
              Event
              <br />
              Intelligence
            </h1>

            <p className="mt-4 max-w-3xl leading-7 text-white/45">
              Track tournament records, prize pools, active event status,
              participating teams, match volume and standings coverage.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <DataSourceBadge label="Tournament Records" />
              <DataSourceBadge label="Standings Aware" />
              <DataSourceBadge label="Modern Event Cards" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/standings"
              className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              Standings
            </Link>

            <Link
              href="/matches"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              Matches
            </Link>

            <Link
              href="/data"
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/55 transition hover:border-white/25 hover:text-white"
            >
              Data Trust
            </Link>
          </div>
        </div>
      </section>

      <PublicTrustNotice variant="tournaments" />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Events" value={tournaments.length} />
        <Metric label="Live" value={liveTournaments} />
        <Metric label="Completed" value={completedTournaments} />
        <Metric label="Verified" value={verifiedTournaments} />
        <Metric label="Prize Pool" value={formatPrizePool(totalPrizePool)} muted />
      </section>

      <section className={card + " p-5 md:p-6"}>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Event Cards" />
              <DataSourceBadge label="Compact View" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Tournaments
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Tournament Records
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Minimal cards with event status, prize pool, match coverage and
              standings coverage.
            </p>
          </div>

          <p className="text-sm text-white/35">
            {tournaments.length} tournaments
          </p>
        </div>

        {tournaments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                matchCount={matchesByTournament.get(tournament.id) || 0}
                standingCount={standingsByTournament.get(tournament.id) || 0}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No tournaments available yet.
          </p>
        )}
      </section>
    </main>
  );
}

