import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Tone = "neutral" | "healthy" | "warning" | "danger";

type ReadinessRow = {
  external_match_id: string;
  shard: string | null;
  map_name: string | null;
  game_mode: string | null;
  created_at_api: string | null;
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

type ApiImportJob = {
  id: string;
  provider: string | null;
  job_type: string | null;
  status: string | null;
  raw_import_count: number | null;
  normalized_match_count: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};

type SafeCount = {
  count: number;
  error: string | null;
};

const shell =
  "rounded-[2rem] border border-white/10 bg-[#080a0f] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

const panel =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function safeCount(table: string): Promise<SafeCount> {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  return {
    count: n(count),
    error: error?.message || null,
  };
}

function toneStyle(tone: Tone) {
  if (tone === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/25 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/60";
}

function formatDate(value: string | null) {
  if (!value) return "TBD";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value: string | null) {
  return (value || "unknown").replace(/_/g, " ");
}

function SectionHeader({
  eyebrow,
  title,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffd21a]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
          {title}
        </h2>
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="w-fit text-sm font-black text-white/40 transition hover:text-[#ffd21a]"
        >
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}

function StatBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  return (
    <div className={panel + " p-4"}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          tone === "healthy"
            ? "text-emerald-300"
            : tone === "warning"
              ? "text-yellow-300"
              : tone === "danger"
                ? "text-red-300"
                : "text-white"
        }`}
      >
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  label,
  value,
  description,
  href,
  tone = "neutral",
}: {
  title: string;
  label: string;
  value: number;
  description: string;
  href: string;
  tone?: Tone;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-[#ffd21a]/30 hover:bg-white/[0.045]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
            {label}
          </p>

          <h3 className="mt-3 text-xl font-black text-white">{title}</h3>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
            tone
          )}`}
        >
          {value.toLocaleString("en-IN")}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/45">{description}</p>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-white/30 transition group-hover:text-[#ffd21a]">
        Open
      </p>
    </Link>
  );
}

function WorkflowStep({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
        {label}
      </p>

      <h3 className="mt-3 text-lg font-black text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}

function JobRow({ job }: { job: ApiImportJob }) {
  const tone: Tone =
    job.status === "completed"
      ? "healthy"
      : job.status === "failed"
        ? "danger"
        : "warning";

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[1fr_0.8fr_0.8fr_1.4fr]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Job
        </p>

        <p className="mt-2 text-sm font-black text-white">
          {job.job_type || "Unknown"}
        </p>

        <p className="mt-1 text-xs text-white/35">
          Started {formatDate(job.started_at)}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Status
        </p>

        <span
          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
            tone
          )}`}
        >
          {job.status || "unknown"}
        </span>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Normalized
        </p>

        <p className="mt-2 text-sm font-black text-white">
          {n(job.normalized_match_count)}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          Error
        </p>

        <p className="mt-2 text-sm leading-6 text-white/45">
          {job.error_message || "No error"}
        </p>
      </div>
    </div>
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
  const rosterHealthRows = (rosterHealthResult.data || []) as RosterHealthRow[];
  const latestJobs = (latestJobsResult.data || []) as ApiImportJob[];

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

  const latestReadiness = readinessRows[0] || null;

  const tableErrorEntries: Array<[string, string | null | undefined]> = [
    ["raw_esports_imports", rawImports.error],
    ["api_import_jobs", apiJobs.error],
    ["pubg_api_matches", pubgMatches.error],
    ["pubg_api_participants", pubgParticipants.error],
    ["pubg_api_rosters", pubgRosters.error],
    ["pubg_player_mappings", pubgMappings.error],
    ["player_roster_health", rosterHealthResult.error?.message],
    ["pubg_match_promotion_readiness", readinessResult.error?.message],
    ["api_import_jobs_recent", latestJobsResult.error?.message],
  ];

  const tableErrors = tableErrorEntries.filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Admin Console" size="md" />
                <DataSourceBadge label="PUBG API" size="md" />
                <DataSourceBadge label="Staging Safe" size="md" />
              </div>

              <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                PUBG API
                <br />
                Control Hub
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Central control layer for PUBG API imports, staging tables,
                player mappings, promotion readiness and roster safety.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/pubg/import"
                  className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                >
                  Import Match
                </Link>

                <Link
                  href="/admin/pubg/imports"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Import Review
                </Link>

                <Link
                  href="/admin/pubg/mappings"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Player Mappings
                </Link>

                <Link
                  href="/admin"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Admin Home
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Raw Imports" value={rawImports.count} />
              <StatBlock label="API Jobs" value={apiJobs.count} />
              <StatBlock
                label="Ready"
                value={readyCount}
                tone={readyCount > 0 ? "healthy" : "neutral"}
              />
              <StatBlock
                label="Blocked"
                value={blockedCount}
                tone={blockedCount > 0 ? "warning" : "healthy"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Promotion Gate"
            title="Readiness Snapshot"
            actionHref="/admin/pubg/imports"
            actionLabel="Review Imports"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <StatBlock label="Imported Matches" value={readinessRows.length} />
            <StatBlock
              label="Mapped Players"
              value={mappedPlayersFromReadiness}
              tone={mappedPlayersFromReadiness > 0 ? "healthy" : "warning"}
            />
            <StatBlock
              label="Participants"
              value={totalParticipantsFromReadiness}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            {latestReadiness ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <DataSourceBadge label="Latest Import" />

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
                      latestReadiness.promotion_allowed ? "healthy" : "warning"
                    )}`}
                  >
                    {latestReadiness.promotion_allowed ? "Ready" : "Blocked"}
                  </span>
                </div>

                <p className="mt-4 break-all text-sm font-black text-white">
                  {latestReadiness.external_match_id}
                </p>

                <p className="mt-2 text-sm text-white/45">
                  {latestReadiness.map_name || "Unknown map"} ·{" "}
                  {latestReadiness.game_mode || "Unknown mode"} ·{" "}
                  {latestReadiness.shard || "Unknown shard"}
                </p>

                <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-black uppercase text-yellow-300">
                  {formatStatus(latestReadiness.promotion_status)}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/45">
                No promotion readiness rows found yet.
              </p>
            )}
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Workflow"
            title="Staging-to-Core Safety"
          />

          <div className="grid gap-3">
            <WorkflowStep
              label="Step 01"
              title="Import to staging"
              description="PUBG API payloads are stored in raw and staging tables first. Public core tables are not touched."
            />

            <WorkflowStep
              label="Step 02"
              title="Map identities"
              description="Imported player names and account IDs must be mapped to verified PlayRank player records."
            />

            <WorkflowStep
              label="Step 03"
              title="Check promotion"
              description="Promotion readiness confirms mapped players, mapped teams and roster safety before core insert."
            />
          </div>
        </section>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[1fr_1fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Control Panels"
            title="PUBG Operations"
          />

          <div className="grid gap-3">
            <ActionCard
              title="Import Review"
              label="Matches"
              value={pubgMatches.count}
              tone={blockedCount > 0 ? "warning" : "healthy"}
              href="/admin/pubg/imports"
              description="Review imported PUBG matches, readiness status and promotion eligibility."
            />

            <ActionCard
              title="Player Mappings"
              label="Mappings"
              value={pubgMappings.count}
              tone={pubgMappings.count > 0 ? "healthy" : "warning"}
              href="/admin/pubg/mappings"
              description="Map PUBG account IDs and player names to verified PlayRank players."
            />

            <ActionCard
              title="Import Match"
              label="Manual Import"
              value={pubgMatches.count}
              tone="healthy"
              href="/admin/pubg/import"
              description="Import a PUBG Developer API match into raw storage and staging tables."
            />

            <ActionCard
              title="Roster Health"
              label="Safety"
              value={rosterHealthIssues}
              tone={rosterHealthIssues === 0 ? "healthy" : "danger"}
              href="/admin/rosters/health"
              description={`${rosterPromotionSafe.toLocaleString(
                "en-IN"
              )} players are currently promotion-safe.`}
            />
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Staging Tables"
            title="Import Foundation"
            actionHref="/admin/data-health"
            actionLabel="Data Health"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <StatBlock
              label="PUBG Matches"
              value={pubgMatches.count}
              tone={pubgMatches.count > 0 ? "healthy" : "neutral"}
            />
            <StatBlock
              label="Participants"
              value={pubgParticipants.count}
              tone={pubgParticipants.count > 0 ? "healthy" : "neutral"}
            />
            <StatBlock
              label="Rosters"
              value={pubgRosters.count}
              tone={pubgRosters.count > 0 ? "healthy" : "neutral"}
            />
            <StatBlock
              label="Table Errors"
              value={tableErrors.length}
              tone={tableErrors.length === 0 ? "healthy" : "danger"}
            />
          </div>
        </section>
      </section>

      <section className="border-y border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <SectionHeader
            eyebrow="Recent Activity"
            title="PUBG API Jobs"
          />

          {latestJobs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="font-black text-white">No PUBG API jobs found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <SectionHeader
          eyebrow="Errors"
          title="PUBG Admin Access Report"
        />

        {tableErrors.length > 0 ? (
          <div className="space-y-3">
            {tableErrors.map(([table, error]) => (
              <div
                key={table}
                className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
              >
                <p className="font-black uppercase tracking-[0.16em] text-red-300">
                  {table}
                </p>

                <p className="mt-2 text-sm text-white/60">{error}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-lg font-black text-emerald-300">
              No PUBG admin table errors detected.
            </p>

            <p className="mt-2 text-sm text-white/55">
              PUBG import, mapping and readiness tables responded successfully.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}