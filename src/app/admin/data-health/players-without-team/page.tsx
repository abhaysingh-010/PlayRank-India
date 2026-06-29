import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type PlayerRow = {
  id: string;
  ign: string;
  real_name: string | null;
  slug: string | null;
  team_id: string | null;
  role: string | null;
  country: string | null;
  matches_played: number | null;
  total_kills: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
  created_at: string | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPlayerSourceLabel(player: PlayerRow) {
  if (player.source === "krafton_india_esports") return "Official Krafton";
  if (player.source === "pubg_api") return "PUBG API";
  if (player.source === "admin_manual") return "Admin Manual";
  if (player.verified) return "Verified Player";
  return "Player Record";
}

function getPriority(player: PlayerRow) {
  if (player.active === true && n(player.matches_played) >= 5) {
    return {
      label: "High",
      className: "border-red-400/25 bg-red-400/10 text-red-300",
      reason: "Active player with match volume but no team link.",
    };
  }

  if (player.active === true) {
    return {
      label: "Medium",
      className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
      reason: "Active player has no team link.",
    };
  }

  return {
    label: "Low",
    className: "border-white/10 bg-white/[0.04] text-white/55",
    reason: "Inactive or low-context player without team link.",
  };
}

export default async function PlayersWithoutTeamPage() {
  const { data, error } = await supabaseAdmin
    .from("players")
    .select(
      "id, ign, real_name, slug, team_id, role, country, matches_played, total_kills, source, verified, active, created_at"
    )
    .is("team_id", null)
    .order("active", { ascending: false })
    .order("matches_played", { ascending: false })
    .order("ign", { ascending: true });

  const players = (data || []) as PlayerRow[];

  const activeCount = players.filter((player) => player.active !== false).length;
  const verifiedCount = players.filter((player) => player.verified === true).length;
  const highPriorityCount = players.filter(
    (player) => player.active === true && n(player.matches_played) >= 5
  ).length;

  if (error) {
    return (
      <main className="page-shell py-10 text-white">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Admin Data Health
          </p>
          <h1 className="mt-3 text-3xl font-black">Players Without Team</h1>
          <p className="mt-3 text-red-200/80">
            Failed to load player roster-link records.
          </p>
          <p className="mt-2 text-sm text-red-200/55">{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-6 py-8 text-white">
      <section className="rounded-[2rem] border border-white/10 bg-[#07080c] p-7 md:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <DataSourceBadge label="Admin Data Health" />
              <DataSourceBadge label="Players Without Team" />
              <DataSourceBadge label="Roster Integrity" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Data Issue Detail
            </p>

            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Players
              <br />
              Without Team
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              These player records do not have a team_id. Some may be valid free
              agents, but active or verified players without team links weaken
              roster pages, player context, comparisons and tournament analysis.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Open Issues
              </p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">
                {players.length.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                High Priority
              </p>
              <p className="mt-2 text-3xl font-black text-red-300">
                {highPriorityCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Active Players
              </p>
              <p className="mt-2 text-3xl font-black">
                {activeCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Verified
              </p>
              <p className="mt-2 text-3xl font-black">
                {verifiedCount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/admin/data-health"
            className="btn-secondary px-5 py-3 text-sm"
          >
            Back to Data Health
          </Link>
          <Link href="/admin/players" className="btn-primary px-5 py-3 text-sm">
            Open Admin Players
          </Link>
          <Link
            href="/admin/rosters"
            className="btn-secondary px-5 py-3 text-sm"
          >
            Open Rosters
          </Link>
          <Link
            href="/admin/rosters/health"
            className="btn-secondary px-5 py-3 text-sm"
          >
            Roster Health
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Affected Players</h2>
          <p className="mt-2 text-sm text-white/45">
            Link active players to the correct team where possible. Keep true
            free agents unlinked only if that is intentional.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Matches</th>
                <th className="px-6 py-4 text-right">Kills</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {players.length > 0 ? (
                players.map((player) => {
                  const priority = getPriority(player);

                  return (
                    <tr
                      key={player.id}
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-white">{player.ign}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                          {player.real_name || player.country || "Player"}
                        </p>
                      </td>

                      <td className="px-6 py-5 font-mono text-sm text-white/55">
                        {player.slug || "missing-slug"}
                      </td>

                      <td className="px-6 py-5 text-white/55">
                        {player.role || "—"}
                      </td>

                      <td className="px-6 py-5 text-right text-white/65">
                        {n(player.matches_played).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-5 text-right text-white/65">
                        {n(player.total_kills).toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-5">
                        <DataSourceBadge
                          source={player.source}
                          verified={player.verified}
                          label={getPlayerSourceLabel(player)}
                        />
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${priority.className}`}
                          title={priority.reason}
                        >
                          {priority.label}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-white/45">
                        {formatDate(player.created_at)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/players?search=${encodeURIComponent(
                            player.ign
                          )}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                        >
                          Fix
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <p className="text-lg font-black text-emerald-300">
                      No players without team links found.
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                      Player roster links are currently clean.
                    </p>
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