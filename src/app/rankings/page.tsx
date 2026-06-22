import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DataSourceBadge from "@/components/DataSourceBadge";

type RankingRow = {
  entity_id: string;
  entity_type: "team" | "player";
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_url: string | null;
  global_rank: number | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  team_id: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  recent_form: string | null;
  source?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "Snapshot";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}
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

function PlayerAvatar({ ign }: { ign: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/70">
      {getInitials(ign)}
    </div>
  );
}

function getRankPillStyles(rank: number) {
  if (rank === 1) return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  if (rank === 2) return "border-slate-300/25 bg-slate-300/10 text-slate-200";
  if (rank === 3) return "border-orange-400/25 bg-orange-400/10 text-orange-300";
  if (rank <= 10) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";

  return "border-white/10 bg-white/[0.035] text-white/75";
}

function getTopCardStyles(rank: number) {
  if (rank === 1) {
    return {
      card: "border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 via-[#15110a] to-[#0b0d12] shadow-[0_0_34px_rgba(250,204,21,0.24)]",
      glow: "bg-yellow-400/20",
      accent: "text-yellow-300",
    };
  }

  if (rank === 2) {
    return {
      card: "border-slate-300/25 bg-gradient-to-br from-slate-300/14 via-[#101216] to-[#0b0d12] shadow-[0_0_30px_rgba(226,232,240,0.17)]",
      glow: "bg-slate-300/15",
      accent: "text-slate-200",
    };
  }

  return {
    card: "border-orange-400/25 bg-gradient-to-br from-orange-500/16 via-[#14100d] to-[#0b0d12] shadow-[0_0_28px_rgba(251,146,60,0.2)]",
    glow: "bg-orange-400/15",
    accent: "text-orange-300",
  };
}

function getTableRowStyles(rank: number) {
  if (rank === 1) return "bg-yellow-400/[0.055] hover:bg-yellow-400/[0.08]";
  if (rank === 2) return "bg-slate-300/[0.045] hover:bg-slate-300/[0.07]";
  if (rank === 3) return "bg-orange-400/[0.05] hover:bg-orange-400/[0.075]";

  return "hover:bg-white/[0.025]";
}

export default async function RankingsPage() {
  const { data: teamRankingsRaw, error: teamRankingsError } = await supabase
    .from("rankings")
    .select("entity_id, entity_type, rank, score, change, updated_at")
    .eq("entity_type", "team")
    .order("rank", { ascending: true })
    .range(0, 19);

  const { data: playerRankingsRaw, error: playerRankingsError } = await supabase
    .from("rankings")
    .select("entity_id, entity_type, rank, score, change, updated_at")
    .eq("entity_type", "player")
    .order("rank", { ascending: true })
    .range(0, 19);

  const teamRankings = (teamRankingsRaw || []) as RankingRow[];
  const playerRankings = (playerRankingsRaw || []) as RankingRow[];

  const teamIds = teamRankings.map((row) => row.entity_id);
  const playerIds = playerRankings.map((row) => row.entity_id);

  const { data: teamsRaw, error: teamsError } =
    teamIds.length > 0
      ? await supabase
          .from("teams")
          .select(
            "id, name, short_name, slug, logo_url, global_rank, points, wins, kills, matches_played, source, verified, active"
          )
          .in("id", teamIds)
      : { data: [], error: null };

  const { data: playersRaw, error: playersError } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select(
            "id, ign, slug, role, team_id, kd_ratio, avg_damage, win_rate, matches_played, total_kills, mvp_count, recent_form, source, verified, active"
          )
          .in("id", playerIds)
      : { data: [], error: null };

  const teams = (teamsRaw || []) as TeamRow[];
  const players = (playersRaw || []) as PlayerRow[];

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const playerById = new Map(players.map((player) => [player.id, player]));

  const rankedTeams = teamRankings
    .map((ranking) => ({
      ranking,
      team: teamById.get(ranking.entity_id),
    }))
    .filter((item) => item.team);

  const rankedPlayers = playerRankings
    .map((ranking) => ({
      ranking,
      player: playerById.get(ranking.entity_id),
    }))
    .filter((item) => item.player);

  const topThreeTeams = rankedTeams.slice(0, 3);
  const latestTeamUpdate = teamRankings[0]?.updated_at || null;
  const latestPlayerUpdate = playerRankings[0]?.updated_at || null;

  if (teamRankingsError || playerRankingsError || teamsError || playersError) {
    return (
      <main className="page-shell py-10">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <h1 className="text-2xl font-black text-white">Rankings</h1>

          <p className="mt-3 text-red-300">
            Failed to load rankings. Check Supabase permissions and selected
            columns.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-10 py-8 text-white">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-7 shadow-2xl md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,64,56,0.12),transparent_30%)]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="krafton-label">Competitive Order</p>

            <h1 className="mt-4 text-6xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-8xl">
              PlayRank
              <br />
              Rankings
            </h1>

            <p className="mt-5 max-w-3xl text-white/50">
              Official team rankings are Krafton-mapped. Player rankings are
              PlayRank records built from available player and match data.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <DataSourceBadge label="Official Krafton Team Ranking" verified />
              <DataSourceBadge label="PlayRank Player Ranking" />
              <DataSourceBadge label="Ranking Snapshot" />
            </div>
          </div>

          <div className="grid gap-3 text-right md:grid-cols-2 lg:text-left">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="data-label">Team Snapshot</p>
              <p className="mt-2 text-xl font-black text-white">
                {formatDate(latestTeamUpdate)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="data-label">Player Snapshot</p>
              <p className="mt-2 text-xl font-black text-white">
                {formatDate(latestPlayerUpdate)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">
              Official Team Ranking
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Top 3 Teams
            </h2>

            <div className="mt-3">
              <DataSourceBadge label="Official Krafton Ranking" verified />
            </div>
          </div>

          <Link
            href="/teams"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
          >
            View all teams
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {topThreeTeams.map(({ ranking, team }) => {
            const styles = getTopCardStyles(ranking.rank);

            return (
              <Link
                key={ranking.entity_id}
                href={`/teams/${team!.slug}`}
                className={`group relative overflow-hidden rounded-[1.8rem] border p-6 transition duration-300 hover:-translate-y-1 ${styles.card}`}
              >
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${styles.glow}`}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_42%)] opacity-0 transition group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <TeamLogo
                      name={team!.name}
                      logoUrl={team!.logo_url}
                      size="lg"
                    />

                    <span
                      className={`rounded-full border px-4 py-1.5 text-sm font-black ${getRankPillStyles(
                        ranking.rank
                      )}`}
                    >
                      #{ranking.rank}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black tracking-tight text-white">
                    {team!.name}
                  </h3>

                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/35">
                    {team!.short_name || "TEAM"}
                  </p>

                  <div className="mt-4">
                    <DataSourceBadge
                      source={team!.source}
                      verified={team!.verified}
                      label={
                        team!.source === "krafton_india_esports"
                          ? "Official Krafton Team"
                          : team!.verified
                          ? "Verified Team"
                          : "Team Record"
                      }
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xs text-white/35">Points</p>
                      <p className={`mt-1 text-2xl font-black ${styles.accent}`}>
                        {ranking.score}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-white/35">WWCD</p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {team!.wins ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Official Krafton Ranking" verified />
              <DataSourceBadge label="Ranking Snapshot" />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
              Team Rankings
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Top 20 official Krafton-mapped PlayRank teams.
            </p>
          </div>
        </div>

        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="sticky top-0 z-20 backdrop-blur-xl">
              <tr className="border-b border-white/10 bg-[#090b10]/90 text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 text-right">WWCD</th>
                <th className="px-6 py-4 text-right">Matches</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>

            <tbody>
              {rankedTeams.map(({ ranking, team }) => (
                <tr
                  key={ranking.entity_id}
                  className={`border-b border-white/[0.06] transition ${getTableRowStyles(
                    ranking.rank
                  )}`}
                >
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyles(
                        ranking.rank
                      )}`}
                    >
                      #{ranking.rank}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <TeamLogo
                        name={team!.name}
                        logoUrl={team!.logo_url}
                        size="sm"
                      />

                      <div>
                        <Link
                          href={`/teams/${team!.slug}`}
                          className="font-bold text-white hover:underline"
                        >
                          {team!.name}
                        </Link>

                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                          {team!.short_name || "TEAM"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    {team!.active !== false ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/35">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-5 text-right font-black text-white">
                    {ranking.score}
                  </td>

                  <td className="px-6 py-5 text-right text-white/65">
                    {team!.wins ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {team!.matches_played ?? 0}
                  </td>

                  <td className="px-6 py-5 text-right text-white/45">
                    {team!.kills ?? 0}
                  </td>

                  <td className="px-6 py-5">
                    <DataSourceBadge
                      source={team!.source}
                      verified={team!.verified}
                      label={
                        team!.source === "krafton_india_esports"
                          ? "Official Krafton"
                          : team!.verified
                          ? "Verified"
                          : "Record"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="PlayRank Player Ranking" />
              <DataSourceBadge label="Analytics Generated" />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
              Player Rankings
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Player ranking is currently based on PlayRank match and seed data.
            </p>
          </div>

          <Link
            href="/players"
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
          >
            View players
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Score</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4 text-right">Damage</th>
                <th className="px-6 py-4 text-right">MVP</th>
                <th className="px-6 py-4">Form</th>
                <th className="px-6 py-4">Source</th>
              </tr>
            </thead>

            <tbody>
              {rankedPlayers.length > 0 ? (
                rankedPlayers.map(({ ranking, player }) => (
                  <tr
                    key={ranking.entity_id}
                    className={`border-b border-white/[0.06] transition ${getTableRowStyles(
                      ranking.rank
                    )}`}
                  >
                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-black ${getRankPillStyles(
                          ranking.rank
                        )}`}
                      >
                        #{ranking.rank}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <PlayerAvatar ign={player!.ign} />

                        <div>
                          <Link
                            href={`/players/${player!.slug}`}
                            className="font-bold text-white hover:underline"
                          >
                            {player!.ign}
                          </Link>

                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                            Player
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-white/60">
                      {player!.role || "—"}
                    </td>

                    <td className="px-6 py-5 text-right font-black text-white">
                      {ranking.score}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {player!.total_kills ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {player!.avg_damage ?? 0}
                    </td>

                    <td className="px-6 py-5 text-right text-white/65">
                      {player!.mvp_count ?? 0}
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {player!.recent_form || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <DataSourceBadge
                        source={player!.source}
                        verified={player!.verified}
                        label={
                          player!.verified ? "Verified Player" : "PlayRank"
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-white/45"
                  >
                    No player rankings available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}