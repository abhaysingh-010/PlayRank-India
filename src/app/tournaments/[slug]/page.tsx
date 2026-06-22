import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type TournamentRow = {
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
};

type TeamMini = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  country: string | null;
  global_rank: number | null;
  logo_url: string | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

type StandingRow = {
  id: string;
  tournament_id: string;
  team_id: string;
  rank: number | null;
  points: number | null;
  kills: number | null;
  wins: number | null;
  matches_played: number | null;
  team: TeamMini | null;
};

type MatchRow = {
  id: string;
  tournament_id: string;
  team1_id: string | null;
  team2_id: string | null;
  winner_team_id: string | null;
  team1_score: number | null;
  team2_score: number | null;
  map_name: string | null;
  stage: string | null;
  date: string | null;
  team1: TeamMini | null;
  team2: TeamMini | null;
  winner: TeamMini | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  total_kills: number | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  mvp_count: number | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatValue(value: unknown, decimals = 0) {
  const safe = n(value);
  return decimals > 0 ? safe.toFixed(decimals) : Math.round(safe).toString();
}

function formatDate(value: string | null) {
  if (!value) return "TBD";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: unknown) {
  const safe = n(value);

  if (!safe) return "TBD";

  return `₹${safe.toLocaleString("en-IN")}`;
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

function getTeamBadgeLabel(team?: TeamMini | null) {
  if (!team) return "Team Record";

  if (team.source === "krafton_india_esports") {
    return "Official Krafton Team";
  }

  if (team.verified) {
    return "Verified Team";
  }

  return "Team Record";
}

function getPlayerBadgeLabel(player?: PlayerRow | null) {
  if (!player) return "Player Record";

  if (player.source === "krafton_india_esports") {
    return "Official Krafton Player";
  }

  if (player.verified) {
    return "Verified Player";
  }

  return "Player Record";
}

function TeamLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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

function Bar({ label, value }: { label: string; value: number }) {
  const safeValue = clamp(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className="font-bold text-white/80">{safeValue}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#ffd21a]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function getRowStyle(rank: number | null) {
  if (rank === 1) return "bg-yellow-400/[0.055] hover:bg-yellow-400/[0.08]";
  if (rank === 2) return "bg-slate-300/[0.045] hover:bg-slate-300/[0.07]";
  if (rank === 3) return "bg-orange-400/[0.05] hover:bg-orange-400/[0.075]";
  return "hover:bg-white/[0.025]";
}

function getRankPillStyle(rank: number | null) {
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  return "border-white/10 bg-white/[0.035] text-white/75";
}

function PodiumCard({
  label,
  standing,
  tone,
}: {
  label: string;
  standing: StandingRow | undefined;
  tone: "gold" | "silver" | "bronze";
}) {
  const toneClass =
    tone === "gold"
      ? "border-yellow-400/20 bg-yellow-400/[0.055] text-yellow-300"
      : tone === "silver"
      ? "border-slate-300/20 bg-slate-300/[0.045] text-slate-200"
      : "border-orange-400/20 bg-orange-400/[0.05] text-orange-300";

  return (
    <div className={`rounded-[2rem] border p-5 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] opacity-80">
        {label}
      </p>

      <h3 className="mt-4 line-clamp-1 text-2xl font-black text-white">
        {standing?.team?.name || "—"}
      </h3>

      <p className="mt-2 text-sm text-white/45">
        {standing?.points ?? 0} pts · {standing?.kills ?? 0} kills
      </p>

      {standing?.team ? (
        <div className="mt-4">
          <DataSourceBadge
            source={standing.team.source}
            verified={standing.team.verified}
            label={getTeamBadgeLabel(standing.team)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: tournamentRaw } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tournamentRaw) {
    notFound();
  }

  const tournament = tournamentRaw as TournamentRow;

  const [{ data: standingsRaw }, { data: matchesRaw }, { data: topPlayerRaw }] =
    await Promise.all([
      supabase
        .from("tournament_standings")
        .select(
          `
          *,
          team:team_id (
            id,
            name,
            slug,
            short_name,
            country,
            global_rank,
            logo_url,
            source,
            verified,
            active
          )
        `
        )
        .eq("tournament_id", tournament.id)
        .order("rank", { ascending: true }),

      supabase
        .from("matches")
        .select(
          `
          *,
          team1:team1_id (
            id,
            name,
            slug,
            source,
            verified,
            active
          ),
          team2:team2_id (
            id,
            name,
            slug,
            source,
            verified,
            active
          ),
          winner:winner_team_id (
            id,
            name,
            slug,
            source,
            verified,
            active
          )
        `
        )
        .eq("tournament_id", tournament.id)
        .order("date", { ascending: false }),

      supabase
        .from("players")
        .select(
          "id, ign, slug, total_kills, kd_ratio, avg_damage, mvp_count, source, verified, active"
        )
        .order("total_kills", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const standings = (standingsRaw || []) as StandingRow[];
  const matches = (matchesRaw || []) as MatchRow[];
  const topPlayer = topPlayerRaw as PlayerRow | null;

  const champion = standings[0];
  const runnerUp = standings[1];
  const thirdPlace = standings[2];

  const totalKills = standings.reduce((sum, team) => sum + n(team.kills), 0);
  const totalWins = standings.reduce((sum, team) => sum + n(team.wins), 0);
  const totalMatches = standings.reduce(
    (sum, team) => sum + n(team.matches_played),
    0
  );

  const top5Teams = standings.slice(0, 5);

  const powerRankings = top5Teams
    .map((team) => {
      const powerScore =
        n(team.points) * 0.45 + n(team.kills) * 0.35 + n(team.wins) * 12;

      return {
        ...team,
        powerScore: Math.round(powerScore),
      };
    })
    .sort((a, b) => b.powerScore - a.powerScore);

  const powerLeader = powerRankings[0];

  const difficultyIndex =
    standings.length > 0
      ? Math.round(
          standings.reduce(
            (sum, item) => sum + n(item.points) + n(item.kills),
            0
          ) / standings.length
        )
      : 0;

  const difficultyLabel =
    difficultyIndex > 250
      ? "Elite"
      : difficultyIndex > 150
      ? "Hard"
      : "Moderate";

  const championOutput = champion
    ? Math.round(n(champion.points) * 0.6 + n(champion.kills) * 0.4)
    : 0;

  const killPressure = clamp(Math.round(totalKills / Math.max(1, standings.length)));
  const winDensity = clamp(Math.round(totalWins * 9));
  const matchVolume = clamp(Math.round(totalMatches / 2));
  const difficultyScore = clamp(Math.round(difficultyIndex / 3));

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_30%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <DataSourceBadge label="Tournament Record" size="md" />
              <DataSourceBadge label="Standings Data" size="md" />
              <DataSourceBadge label="Match Data" size="md" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Tournament Profile
            </p>

            <h1 className="mt-2 max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">
              {tournament.name}
            </h1>

            <p className="mt-3 text-white/45">
              {tournament.organizer || "Organizer N/A"} ·{" "}
              {tournament.location || "Location N/A"} ·{" "}
              {formatDate(tournament.start_date)} — {formatDate(tournament.end_date)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a]">
              {tournament.status || "Status N/A"}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/65">
              {formatMoney(tournament.prize_pool)}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Teams"
          value={tournament.participating_teams || standings.length || "—"}
        />
        <Metric label="Total Kills" value={totalKills} />
        <Metric label="WWCD" value={totalWins} />
        <Metric label="Matches" value={totalMatches} />
        <Metric label="Difficulty" value={difficultyLabel} muted />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <PodiumCard label="Champion" standing={champion} tone="gold" />
        <PodiumCard label="Runner Up" standing={runnerUp} tone="silver" />
        <PodiumCard label="Third Place" standing={thirdPlace} tone="bronze" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={card + " p-6"}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <DataSourceBadge label="Tournament Intelligence" />
                <DataSourceBadge label="Analytics Generated" />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Tournament Intelligence
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Competitive Read
              </h2>
            </div>

            <div className="text-right">
              <p className="text-3xl font-black text-[#ffd21a]">
                {difficultyIndex}
              </p>
              <p className="text-xs text-white/35">Difficulty Index</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              label="Power Leader"
              value={powerLeader?.team?.short_name || powerLeader?.team?.name || "—"}
            />
            <Metric label="Champion Output" value={championOutput} />
            <Metric label="Tier" value={difficultyLabel} muted />
          </div>

          <div className="mt-6 space-y-5">
            <Bar label="Kill Pressure" value={killPressure} />
            <Bar label="Win Density" value={winDensity} />
            <Bar label="Match Volume" value={matchVolume} />
            <Bar label="Difficulty" value={difficultyScore} />
          </div>
        </section>

        <section className={card + " p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
                Featured Player
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                {topPlayer?.ign || "—"}
              </h2>
            </div>

            <DataSourceBadge label="Featured Player Analytics" />
          </div>

          <div className="mt-4">
            <DataSourceBadge
              source={topPlayer?.source}
              verified={topPlayer?.verified}
              label={getPlayerBadgeLabel(topPlayer)}
            />
          </div>

          <p className="mt-4 leading-7 text-white/55">
            Top player snapshot based on current player pool output. This can be
            replaced later with tournament-specific player stats once that data
            is connected.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Metric label="Kills" value={topPlayer?.total_kills ?? 0} />
            <Metric label="KD" value={formatValue(topPlayer?.kd_ratio, 2)} muted />
            <Metric label="Avg DMG" value={formatValue(topPlayer?.avg_damage)} />
            <Metric label="MVP" value={topPlayer?.mvp_count ?? 0} muted />
          </div>

          {topPlayer?.slug ? (
            <Link
              href={`/players/${topPlayer.slug}`}
              className="mt-5 inline-flex rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              View Player
            </Link>
          ) : null}
        </section>
      </section>

      <section className={card + " p-6"}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Power Rankings" />
              <DataSourceBadge label="Analytics Generated" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Power Rankings
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Top Tournament Teams
            </h2>
          </div>

          <p className="text-sm text-white/35">Top 5 by tournament output</p>
        </div>

        <div className="space-y-3">
          {powerRankings.length > 0 ? (
            powerRankings.map((team, index) => (
              <Link
                key={team.id}
                href={`/teams/${team.team?.slug}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 text-sm font-black text-white/35">
                    #{index + 1}
                  </span>

                  <TeamLogo
                    name={team.team?.name || "Team"}
                    logoUrl={team.team?.logo_url || null}
                  />

                  <div>
                    <p className="font-black text-white">
                      {team.team?.name || "Team N/A"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                      {team.points || 0} pts · {team.kills || 0} kills
                    </p>

                    <div className="mt-2">
                      <DataSourceBadge
                        source={team.team?.source}
                        verified={team.team?.verified}
                        label={getTeamBadgeLabel(team.team)}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-2xl font-black text-[#ffd21a]">
                  {team.powerScore}
                </p>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
              No power ranking data available yet.
            </p>
          )}
        </div>
      </section>

      <section className={card + " overflow-hidden"}>
        <div className="flex flex-col gap-2 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Standings Data" />
              <DataSourceBadge label="Tournament Table" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Standings
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Tournament Table
            </h2>
          </div>
        </div>

        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">WWCD</th>
                <th className="px-6 py-4 text-right">Matches</th>
              </tr>
            </thead>

            <tbody>
              {standings.length > 0 ? (
                standings.map((standing) => (
                  <tr
                    key={standing.id}
                    className={`border-b border-white/[0.06] transition ${getRowStyle(
                      standing.rank
                    )}`}
                  >
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyle(
                          standing.rank
                        )}`}
                      >
                        #{standing.rank || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <TeamLogo
                          name={standing.team?.name || "Team"}
                          logoUrl={standing.team?.logo_url || null}
                        />

                        <div>
                          {standing.team?.slug ? (
                            <Link
                              href={`/teams/${standing.team.slug}`}
                              className="font-bold text-white hover:underline"
                            >
                              {standing.team.name}
                            </Link>
                          ) : (
                            <p className="font-bold text-white">Team N/A</p>
                          )}

                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                            {standing.team?.short_name || standing.team?.country || "TEAM"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={standing.team?.source}
                        verified={standing.team?.verified}
                        label={getTeamBadgeLabel(standing.team)}
                      />
                    </td>

                    <td className="px-6 py-5 text-right font-black text-white">
                      {standing.points ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {standing.kills ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {standing.wins ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/45">
                      {standing.matches_played ?? 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-white/45">
                    No standings available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card + " p-6"}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <DataSourceBadge label="Match Data" />
              <DataSourceBadge label="Tournament Matches" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Matches
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Tournament Matches
            </h2>
          </div>

          <p className="text-sm text-white/35">{matches.length} matches</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match) => (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#ffd21a]/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                      {match.stage || "Match"}
                    </p>

                    <h3 className="mt-3 text-lg font-black text-white">
                      {match.team1?.name || "Team 1"}
                      <span className="px-2 text-white/25">vs</span>
                      {match.team2?.name || "Team 2"}
                    </h3>

                    <p className="mt-2 text-sm text-white/40">
                      {match.map_name || "Map N/A"} · {formatDate(match.date)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <DataSourceBadge
                        source={match.team1?.source}
                        verified={match.team1?.verified}
                        label={getTeamBadgeLabel(match.team1)}
                      />

                      <DataSourceBadge
                        source={match.team2?.source}
                        verified={match.team2?.verified}
                        label={getTeamBadgeLabel(match.team2)}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-white">
                      {match.team1_score ?? 0}
                      <span className="px-2 text-white/25">—</span>
                      {match.team2_score ?? 0}
                    </p>

                    <p className="mt-2 text-xs text-white/40">
                      Winner:{" "}
                      <span className="font-bold text-[#ffd21a]">
                        {match.winner?.name || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45 md:col-span-2">
              No tournament matches available yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}