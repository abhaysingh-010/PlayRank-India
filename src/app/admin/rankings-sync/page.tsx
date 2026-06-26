import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import RecalculateRankingsButton from "./RecalculateRankingsButton";

export const dynamic = "force-dynamic";

type RankingRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  rank: number | null;
  score: number | null;
  change: number | null;
  updated_at: string | null;
};

type RankingHistoryRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  rank: number | null;
  score: number | null;
  snapshot_date: string | null;
  created_at: string | null;
};

type JobRow = {
  id: string;
  provider: string | null;
  job_type: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  response_summary: unknown;
};

type Tone = "healthy" | "warning" | "danger" | "neutral";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toneClass(tone: Tone) {
  if (tone === "healthy") {
    return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/20 bg-red-400/[0.06] text-red-300";
  }

  return "border-white/10 bg-white/[0.035] text-white";
}

function StatBlock({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${toneClass(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string | null }) {
  const value = status || "unknown";

  const className =
    value === "completed"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : value === "failed"
        ? "border-red-400/25 bg-red-400/10 text-red-300"
        : value === "running"
          ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
          : "border-white/10 bg-white/[0.04] text-white/45";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${className}`}
    >
      {value}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 border-b border-white/10 pb-4">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
        {description}
      </p>
    </div>
  );
}

export default async function AdminRankingsSyncPage() {
  const [
    rankingsResult,
    teamRankingsResult,
    playerRankingsResult,
    latestHistoryResult,
    historyCountResult,
    jobsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("rankings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("rankings")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", "team"),
    supabaseAdmin
      .from("rankings")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", "player"),
    supabaseAdmin
      .from("ranking_history")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("ranking_history")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("api_import_jobs")
      .select("*")
      .eq("provider", "playrank_internal")
      .eq("job_type", "recalculate_rankings")
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const latestRankings = (rankingsResult.data || []) as RankingRow[];
  const latestHistory = (latestHistoryResult.data || []) as RankingHistoryRow[];
  const jobs = (jobsResult.data || []) as JobRow[];

  const latestRankingUpdate =
    latestRankings.find((ranking) => ranking.updated_at)?.updated_at || null;

  const latestSnapshot =
    latestHistory.find((history) => history.snapshot_date)?.snapshot_date ||
    latestHistory.find((history) => history.created_at)?.created_at ||
    null;

  const latestJob = jobs[0] || null;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const runningJobs = jobs.filter((job) => job.status === "running").length;

  const errors = [
    rankingsResult.error?.message,
    teamRankingsResult.error?.message,
    playerRankingsResult.error?.message,
    latestHistoryResult.error?.message,
    historyCountResult.error?.message,
    jobsResult.error?.message,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="Internal Console" size="md" />
            <DataSourceBadge label="Protected" size="md" />
            <DataSourceBadge label="Ranking Sync" size="md" />
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#ffd21a]">
                PlayRank Admin
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                Ranking Sync
                <br />
                Protection
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Protected control layer for ranking recalculation, player score
                sync and ranking drift checks. Public users should never be able
                to trigger ranking mutations.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Admin Home
                </Link>
                <Link
                  href="/admin/data-health"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Data Health
                </Link>
                <Link
                  href="/rankings"
                  className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                >
                  Public Rankings
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock
                label="Team Rankings"
                value={teamRankingsResult.count ?? 0}
                detail="Active ranking rows marked as teams."
                tone="healthy"
              />
              <StatBlock
                label="Player Rankings"
                value={playerRankingsResult.count ?? 0}
                detail="Active ranking rows marked as players."
                tone="healthy"
              />
              <StatBlock
                label="Snapshots"
                value={historyCountResult.count ?? 0}
                detail="Total ranking_history rows."
              />
              <StatBlock
                label="Failed Jobs"
                value={failedJobs}
                detail="Recent internal ranking sync failures."
                tone={failedJobs > 0 ? "danger" : "healthy"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5">
            <SectionHeader
              eyebrow="Sync Status"
              title="Ranking Drift Guard"
              description="Use this panel to confirm when rankings were last updated, when the last snapshot was created and whether a recalculation job recently failed."
            />

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Latest Ranking Update
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {formatDate(latestRankingUpdate)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Latest Ranking Snapshot
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {formatDate(latestSnapshot)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Latest Internal Job
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-lg font-black text-white">
                    {latestJob ? formatDate(latestJob.started_at) : "No jobs yet"}
                  </p>
                  {latestJob && <JobStatusBadge status={latestJob.status} />}
                </div>
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  runningJobs > 0
                    ? "border-yellow-400/20 bg-yellow-400/[0.06]"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Running Jobs
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {runningJobs}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Avoid triggering repeated recalculations while a previous job
                  is still running.
                </p>
              </div>
            </div>
          </section>

          <RecalculateRankingsButton />
        </div>

        <div className="space-y-5">
          {errors.length > 0 && (
            <section className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-5">
              <SectionHeader
                eyebrow="Query Errors"
                title="Ranking Sync Data Errors"
                description="Some dashboard checks failed. The protected route may still work, but this page could not read all support data."
              />

              <div className="grid gap-2">
                {errors.map((error) => (
                  <p
                    key={error}
                    className="rounded-xl border border-red-400/15 bg-black/20 p-3 text-sm text-red-200"
                  >
                    {error}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5">
            <SectionHeader
              eyebrow="Recent Jobs"
              title="Ranking Recalculation Log"
              description="Recent protected internal jobs created when player score recalculation was triggered."
            />

            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-sm font-black text-white">
                  No ranking recalculation jobs found.
                </p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Once you run the protected action, job records will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                          {job.job_type || "recalculate_rankings"}
                        </p>
                        <p className="mt-2 text-sm font-black text-white">
                          {formatDate(job.started_at)}
                        </p>
                      </div>
                      <JobStatusBadge status={job.status} />
                    </div>

                    <div className="mt-3 grid gap-2 text-xs leading-5 text-white/45 md:grid-cols-2">
                      <p>Provider: {job.provider || "playrank_internal"}</p>
                      <p>Completed: {formatDate(job.completed_at)}</p>
                    </div>

                    {job.error_message && (
                      <p className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[0.06] p-3 text-sm text-red-200">
                        {job.error_message}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#080a0f] p-5">
            <SectionHeader
              eyebrow="Latest Rows"
              title="Latest Ranking Records"
              description="Recent ranking records ordered by update time. Use this for quick sanity checks after recalculation."
            />

            {latestRankings.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm text-white/45">
                No ranking rows found.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.18em] text-white/35">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Change</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {latestRankings.map((ranking) => (
                      <tr key={ranking.id} className="text-white/60">
                        <td className="px-4 py-3 font-black text-white">
                          {ranking.entity_type}
                        </td>
                        <td className="px-4 py-3">#{n(ranking.rank)}</td>
                        <td className="px-4 py-3">{n(ranking.score)}</td>
                        <td className="px-4 py-3">{n(ranking.change)}</td>
                        <td className="px-4 py-3">
                          {formatDate(ranking.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}