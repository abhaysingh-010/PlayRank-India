import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type RankingRow = {
  id: string;
  entity_id: string;
  entity_type: string;
  rank: number | null;
  score: number | null;
  change: number | null;
  updated_at: string | null;
};

type EntityRow = {
  id: string;
};

type OrphanRankingIssue = RankingRow & {
  reason: string;
};

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

function formatChange(value: number | null) {
  if (!value) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

function entityBadge(entityType: string) {
  if (entityType === "team") return "Team Ranking";
  if (entityType === "player") return "Player Ranking";
  return "Unknown Entity";
}

export default async function OrphanRankingsPage() {
  const { data: rankingsRaw, error: rankingsError } = await supabaseAdmin
    .from("rankings")
    .select("id, entity_id, entity_type, rank, score, change, updated_at")
    .order("entity_type", { ascending: true })
    .order("rank", { ascending: true });

  const rankings = (rankingsRaw || []) as RankingRow[];

  const teamIds = rankings
    .filter((row) => row.entity_type === "team")
    .map((row) => row.entity_id);

  const playerIds = rankings
    .filter((row) => row.entity_type === "player")
    .map((row) => row.entity_id);

  const [teamsResult, playersResult] = await Promise.all([
    teamIds.length > 0
      ? supabaseAdmin.from("teams").select("id").in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),

    playerIds.length > 0
      ? supabaseAdmin.from("players").select("id").in("id", playerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = rankingsError || teamsResult.error || playersResult.error;

  const existingTeamIds = new Set(
    ((teamsResult.data || []) as EntityRow[]).map((row) => row.id)
  );

  const existingPlayerIds = new Set(
    ((playersResult.data || []) as EntityRow[]).map((row) => row.id)
  );

  const orphanRankings: OrphanRankingIssue[] = rankings
    .map((ranking) => {
      if (ranking.entity_type === "team" && !existingTeamIds.has(ranking.entity_id)) {
        return {
          ...ranking,
          reason: "Ranking points to a missing team record.",
        };
      }

      if (
        ranking.entity_type === "player" &&
        !existingPlayerIds.has(ranking.entity_id)
      ) {
        return {
          ...ranking,
          reason: "Ranking points to a missing player record.",
        };
      }

      if (ranking.entity_type !== "team" && ranking.entity_type !== "player") {
        return {
          ...ranking,
          reason: "Ranking uses an unsupported entity_type.",
        };
      }

      return null;
    })
    .filter((row): row is OrphanRankingIssue => Boolean(row));

  if (error) {
    return (
      <main className="page-shell py-10 text-white">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Admin Data Health
          </p>
          <h1 className="mt-3 text-3xl font-black">Orphan Rankings</h1>
          <p className="mt-3 text-red-200/80">
            Failed to load orphan-ranking records.
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
              <DataSourceBadge label="Orphan Rankings" />
              <DataSourceBadge label="Ranking Integrity" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Data Issue Detail
            </p>

            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Orphan
              <br />
              Rankings
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              These ranking rows point to missing or unsupported entities.
              Orphan rankings can create broken ranking tables, dead profile
              links and inaccurate comparison data.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Open Issues
              </p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">
                {orphanRankings.length.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Priority
              </p>
              <p className="mt-2 text-3xl font-black">P1</p>
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
          <Link
            href="/admin/rankings-sync"
            className="btn-primary px-5 py-3 text-sm"
          >
            Open Rankings Sync
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Affected Ranking Rows</h2>
          <p className="mt-2 text-sm text-white/45">
            Fix by restoring the missing entity, removing stale ranking rows, or
            rerunning a controlled ranking sync after source data is corrected.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Entity ID</th>
                <th className="px-6 py-4 text-right">Rank</th>
                <th className="px-6 py-4 text-right">Score</th>
                <th className="px-6 py-4 text-right">Change</th>
                <th className="px-6 py-4">Updated</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {orphanRankings.length > 0 ? (
                orphanRankings.map((ranking) => (
                  <tr
                    key={ranking.id}
                    className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5">
                      <DataSourceBadge label={entityBadge(ranking.entity_type)} />
                    </td>

                    <td className="px-6 py-5">
                      <code className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/60">
                        {ranking.entity_id}
                      </code>
                    </td>

                    <td className="px-6 py-5 text-right font-black">
                      {ranking.rank ? `#${ranking.rank}` : "—"}
                    </td>

                    <td className="px-6 py-5 text-right text-white/70">
                      {ranking.score ?? "—"}
                    </td>

                    <td className="px-6 py-5 text-right text-white/55">
                      {formatChange(ranking.change)}
                    </td>

                    <td className="px-6 py-5 text-white/45">
                      {formatDate(ranking.updated_at)}
                    </td>

                    <td className="px-6 py-5 text-sm text-white/50">
                      {ranking.reason}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href="/admin/rankings-sync"
                        className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-lg font-black text-emerald-300">
                      No orphan rankings found.
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                      Ranking entity references are currently clean.
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