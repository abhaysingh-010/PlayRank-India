import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ReadinessRow = {
  external_match_id: string;
  promotion_allowed: boolean | null;
  promotion_status: string | null;
  total_participants: number | null;
  mapped_players: number | null;
  mapped_teams: number | null;
};

type RosterHealthRow = {
  health_status: string | null;
  promotion_safe: boolean | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function safeCount(table: string) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    count: n(count),
    error: error?.message || null,
  };
}

function AdminCard({
  label,
  value,
  description,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  tone?: "neutral" | "healthy" | "warning" | "danger";
}) {
  const toneClass =
    tone === "healthy"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : tone === "warning"
        ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
        : tone === "danger"
          ? "border-red-400/25 bg-red-400/10 text-red-300"
          : "border-white/10 bg-white/[0.03] text-white";

  return (
    <Link href={href}className={`krafton-card block p-6 transition hover:border-white/30 ${toneClass}`}>
      <p className="data-label">{label}</p>
      <p className="mt-4 text-5xl font-black tracking-[-0.06em]">{value.toLocaleString("en-IN")}</p>
      <p className="mt-4 leading-7 text-white/55">{description}</p>
    </Link>
  );
}

export default async function PubgAdminHubPage() {
  const [
    rawImports,
    apiJobs,
    pubgMatches,
    pubgParticipants,
    pubgRosters,
    pubgMappings,
    rosterHealthResult,
    readinessResult,
    latestJobsResult,
  ] = await Promise.all([
    safeCount("raw_esports_imports"),
    safeCount("api_import_jobs"),
    safeCount("pubg_api_matches"),
    safeCount("pubg_api_participants"),
    safeCount("pubg_api_rosters"),
    safeCount("pubg_player_mappings"),

    supabaseAdmin.from("player_roster_health").select("*"),

    supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select("*")
      .order("created_at_api", { ascending: false }),

    supabaseAdmin
      .from("api_import_jobs")
      .select(
        "id, provider, job_type, status, raw_import_count, normalized_match_count, error_message, started_at, completed_at"
      )
      .eq("provider", "pubg_developer_api")
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const readinessRows = (readinessResult.data || []) as ReadinessRow[];
  const rosterHealthRows = (rosterHealthResult.data ||
    []) as RosterHealthRow[];

  const rosterHealthIssues = rosterHealthRows.filter(
    (row) => row.health_status !== "healthy"
  ).length;

  const rosterPromotionSafe = rosterHealthRows.filter(
    (row) => row.promotion_safe === true
  ).length;

  const readyCount = readinessRows.filter(
    (row) => row.promotion_allowed === true
  ).length;

  const blockedCount = readinessRows.filter(
    (row) => row.promotion_allowed !== true
  ).length;

  const totalParticipantsFromReadiness = readinessRows.reduce(
    (sum, row) => sum + n(row.total_participants),
    0
  );

  const mappedPlayersFromReadiness = readinessRows.reduce(
    (sum, row) => sum + n(row.mapped_players),
    0
  );

  const latestJobs = latestJobsResult.data || [];

  const tableErrors = [
    ["raw_esports_imports", rawImports.error],
    ["api_import_jobs", apiJobs.error],
    ["pubg_api_matches", pubgMatches.error],
    ["pubg_api_participants", pubgParticipants.error],
    ["pubg_api_rosters", pubgRosters.error],
    ["pubg_player_mappings", pubgMappings.error],
    ["player_roster_health", rosterHealthResult.error?.message],
    ["pubg_match_promotion_readiness", readinessResult.error?.message],
    ["api_import_jobs_recent", latestJobsResult.error?.message],
  ].filter(([, error]) => Boolean(error));
  
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 px-7 py-20 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <p className="krafton-label">Admin Console</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">
            PUBG API
            <br />
            Control Hub
          </h1>
          <p className="mt-6 max-w-3xl text-white/55">
            Central control layer for PUBG API imports, staging tables, player
            mappings, readiness checks and promotion safety.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/data-health" className="btn-secondary px-6 py-3 text-sm">Data Health</Link>
            <Link href="/admin/pubg/imports" className="btn-secondary px-6 py-3 text-sm">Import Review</Link>
            <Link href="/admin/pubg/mappings" className="btn-secondary px-6 py-3 text-sm">Player Mappings</Link>
            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">Admin Home</Link>
            <Link href="/admin/pubg/import" className="btn-primary px-6 py-3 text-sm">Import Match</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div className="krafton-card p-6">
            <p className="data-label">Raw Imports</p>

            <p className="mt-3 text-5xl font-black">
              {rawImports.count.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="krafton-card p-6">
            <p className="data-label">API Jobs</p>

            <p className="mt-3 text-5xl font-black">
              {apiJobs.count.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="krafton-card border-yellow-400/25 p-6">
            <p className="data-label text-yellow-300">Blocked Imports</p>

            <p className="mt-3 text-5xl font-black text-yellow-300">
              {blockedCount.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="krafton-card border-emerald-400/25 p-6">
            <p className="data-label text-emerald-300">Ready Imports</p>
            <p className="mt-3 text-5xl font-black text-emerald-300">
              {readyCount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-16 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">PUBG System</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">
            Control Panels
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            label="Import Review"
            value={pubgMatches.count}
            tone={blockedCount > 0 ? "warning" : "healthy"}
            href="/admin/pubg/imports"
            description="Review imported PUBG matches, readiness status and promotion eligibility."
          />

          <AdminCard
            label="Player Mappings"
            value={pubgMappings.count}
            tone={pubgMappings.count > 0 ? "warning" : "neutral"}
            href="/admin/pubg/mappings"
            description="Map PUBG account IDs and player names to verified PlayRank players."
          />

          <AdminCard
            label="Roster Health"
            value={rosterHealthIssues}
            tone={rosterHealthIssues === 0 ? "healthy" : "danger"}
            href="/admin/rosters/health"
            description={`Roster integrity issues detected. ${rosterPromotionSafe.toLocaleString(
              "en-IN"
            )} players are currently promotion-safe.`}
          />

          <AdminCard
            label="Participants"
            value={pubgParticipants.count}
            tone={pubgParticipants.count > 0 ? "healthy" : "neutral"}
            href="/admin/pubg/mappings"
            description="Imported PUBG participant records stored in staging before promotion."
          />

          <AdminCard
            label="Rosters"
            value={pubgRosters.count}
            tone={pubgRosters.count > 0 ? "healthy" : "neutral"}
            href="/admin/pubg/imports"
            description="Imported PUBG roster/team-slot records normalized from API payloads."
          />

          <AdminCard
            label="Mapped Players"
            value={mappedPlayersFromReadiness}
            tone={mappedPlayersFromReadiness > 0 ? "healthy" : "danger"}
            href="/admin/pubg/mappings"
            description={`Mapped players across imported matches out of ${totalParticipantsFromReadiness.toLocaleString("en-IN")} imported participants.`}
          />

          <AdminCard
            label="Data Health"
            value={tableErrors.length}
            tone={tableErrors.length === 0 ? "healthy" : "danger"}
            href="/admin/data-health"
            description="Open table access errors and data quality warnings across PlayRank."
          />

          <AdminCard
            label="Import Match"
            value={pubgMatches.count}
            tone="healthy"
            href="/admin/pubg/import"
            description="Import a PUBG Developer API match into raw storage and staging tables."
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-16 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 border-b border-white/10 pb-5">
            <p className="krafton-label">Recent Activity</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">PUBG API Jobs</h2>
          </div>

          {latestJobs.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.03] p-6">
              <p className="font-black uppercase text-white">No PUBG API jobs found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_1fr_1fr_2fr]"
                >
                  <div>
                    <p className="data-label">Job Type</p>

                    <p className="mt-2 font-black text-white">
                      {job.job_type}
                    </p>
                  </div>

                  <div>
                    <p className="data-label">Status</p>

                    <p
                      className={`mt-2 font-black uppercase ${
                        job.status === "completed"
                          ? "text-emerald-300"
                          : job.status === "failed"
                            ? "text-red-300"
                            : "text-yellow-300"
                      }`}
                    >
                      {job.status}
                    </p>
                  </div>

                  <div>
                    <p className="data-label">Normalized</p>

                    <p className="mt-2 font-black text-white">
                      {n(job.normalized_match_count)}
                    </p>
                  </div>

                  <div>
                    <p className="data-label">Error</p>

                    <p className="mt-2 text-sm text-white/55">
                      {job.error_message || "No error"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-16 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Errors</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">
            PUBG Admin Access Report
          </h2>
        </div>

        {tableErrors.length > 0 ? (
          <div className="space-y-3">
            {tableErrors.map(([table, error]) => (
              <div
                key={table}
                className="border border-red-400/20 bg-red-400/10 p-5"
              >
                <p className="font-black uppercase tracking-[0.16em] text-red-300">
                  {table}
                </p>

                <p className="mt-2 text-sm text-white/60">{error}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-emerald-400/20 bg-emerald-400/10 p-6">
            <p className="text-xl font-black uppercase tracking-[-0.03em] text-emerald-300">
              No PUBG admin table errors detected.
            </p>

            <p className="mt-3 text-white/55">
              PUBG import, mapping and readiness tables responded successfully.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}