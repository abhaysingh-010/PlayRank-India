import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Tone = "neutral" | "healthy" | "warning" | "danger";

type ReadinessRow = {
  external_match_id: string;
  shard: string | null;
  map_name: string | null;
  game_mode: string | null;
  created_at_api: string | null;
  total_participants: number | null;
  mapped_players: number | null;
  mapped_players_with_team: number | null;
  mapped_teams: number | null;
  mapped_player_percentage: number | null;
  promotion_status: string | null;
  promotion_allowed: boolean | null;
  roster_safe_players: number | null;
  roster_safe_teams: number | null;
  unmapped_players: number | null;
  unsafe_roster_players: number | null;
  ai_participants: number | null;
  human_participants: number | null;
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

type BlockCopy = {
  label: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  tone: Tone;
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

function getReadinessTone(row: ReadinessRow): Tone {
  if (row.promotion_allowed === true) return "healthy";

  if (
    row.promotion_status === "not_ready_contains_ai_participants" ||
    n(row.ai_participants) > 0
  ) {
    return "danger";
  }

  const totalParticipants = n(row.total_participants);
  const mappedPlayers = n(row.mapped_players);

  if (totalParticipants > 0 && mappedPlayers === 0) return "danger";

  return "warning";
}

function getBlockCopy(row: ReadinessRow): BlockCopy {
  const status = row.promotion_status || "unknown";

  if (status === "not_ready_contains_ai_participants") {
    return {
      label: "Rejected Public Match",
      title: "Contains AI Participants",
      description:
        "This PUBG import appears to be a public or non-esports match because AI participants were detected. It is not eligible for PlayRank core promotion.",
      actionLabel: "Import Another Match",
      actionHref: "/admin/pubg/import",
      tone: "danger",
    };
  }

  if (status === "not_ready_unmapped_players") {
    return {
      label: "Identity Mapping Required",
      title: "Unmapped PUBG Players",
      description:
        "PUBG account IDs must be mapped to verified PlayRank player records before this match can move into core data.",
      actionLabel: "Open Match Mappings",
      actionHref: `/admin/pubg/mappings?match=${encodeURIComponent(
        row.external_match_id
      )}`,
      tone: "warning",
    };
  }

  if (status === "not_ready_players_without_team") {
    return {
      label: "Team Link Required",
      title: "Mapped Players Missing Teams",
      description:
        "Every mapped player must have a valid PlayRank team before this match can be promoted safely.",
      actionLabel: "Open Players Admin",
      actionHref: "/admin/players",
      tone: "warning",
    };
  }

  if (status === "not_ready_roster_health") {
    return {
      label: "Roster Health Block",
      title: "Unsafe Roster State",
      description:
        "One or more mapped players failed the active roster safety check. Fix roster health before promotion.",
      actionLabel: "Roster Health",
      actionHref: "/admin/rosters/health",
      tone: "danger",
    };
  }

  if (status === "not_ready_not_enough_safe_teams") {
    return {
      label: "Team Safety Block",
      title: "Not Enough Safe Teams",
      description:
        "Promotion requires at least two roster-safe teams. Check mappings, teams and active rosters.",
      actionLabel: "Roster Health",
      actionHref: "/admin/rosters/health",
      tone: "warning",
    };
  }

  if (status === "ready_for_core_promotion") {
    return {
      label: "Ready For Manual Review",
      title: "Promotion Gate Passed",
      description:
        "This match passed the readiness gate. Keep manual review enabled before writing into PlayRank core tables.",
      actionLabel: "Review PUBG Hub",
      actionHref: "/admin/pubg",
      tone: "healthy",
    };
  }

  return {
    label: "Blocked",
    title: "Promotion Not Available",
    description:
      "This match cannot be promoted yet. Review mapping, roster health and readiness signals before moving it into core tables.",
    actionLabel: "Open PUBG Hub",
    actionHref: "/admin/pubg",
    tone: "warning",
  };
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
          {actionLabel} -&gt;
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

function ReadinessCard({ row }: { row: ReadinessRow }) {
  const tone = getReadinessTone(row);
  const blockCopy = getBlockCopy(row);

  const totalParticipants = n(row.total_participants);
  const mappedPlayers = n(row.mapped_players);
  const mappedTeams = n(row.mapped_teams);
  const rosterSafePlayers = n(row.roster_safe_players);
  const rosterSafeTeams = n(row.roster_safe_teams);
  const unmappedPlayers = n(row.unmapped_players);
  const unsafeRosterPlayers = n(row.unsafe_roster_players);
  const aiParticipants = n(row.ai_participants);
  const humanParticipants = n(row.human_participants);

  const mappedPercent =
    row.mapped_player_percentage === null
      ? totalParticipants > 0
        ? Math.round((mappedPlayers / totalParticipants) * 100)
        : 0
      : n(row.mapped_player_percentage);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
                tone
              )}`}
            >
              {row.promotion_allowed ? "Ready" : blockCopy.label}
            </span>

            <DataSourceBadge label={row.shard || "Shard N/A"} />

            {aiParticipants > 0 ? (
              <span className="rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-300">
                AI Detected
              </span>
            ) : null}
          </div>

          <p className="mt-3 break-all text-sm font-black text-white">
            {row.external_match_id}
          </p>

          <p className="mt-2 text-sm text-white/45">
            {row.map_name || "Unknown map"} {" / "}
            {row.game_mode || "Unknown mode"} {" / "}
            {formatDate(row.created_at_api)}
          </p>
        </div>

        <div className="shrink-0 text-left md:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Promotion Status
          </p>

          <p
            className={`mt-2 text-sm font-black uppercase ${
              tone === "healthy"
                ? "text-emerald-300"
                : tone === "danger"
                  ? "text-red-300"
                  : "text-yellow-300"
            }`}
          >
            {formatStatus(row.promotion_status)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <StatBlock label="Participants" value={totalParticipants} />
        <StatBlock
          label="Human"
          value={humanParticipants}
          tone={humanParticipants > 0 ? "healthy" : "neutral"}
        />
        <StatBlock
          label="AI"
          value={aiParticipants}
          tone={aiParticipants > 0 ? "danger" : "healthy"}
        />
        <StatBlock
          label="Mapped %"
          value={mappedPercent}
          tone={
            mappedPercent >= 100
              ? "healthy"
              : mappedPercent > 0
                ? "warning"
                : "danger"
          }
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <StatBlock
          label="Mapped"
          value={mappedPlayers}
          tone={mappedPlayers === totalParticipants ? "healthy" : "warning"}
        />
        <StatBlock
          label="Unmapped"
          value={unmappedPlayers}
          tone={unmappedPlayers > 0 ? "danger" : "healthy"}
        />
        <StatBlock
          label="Roster Safe"
          value={rosterSafePlayers}
          tone={rosterSafePlayers === totalParticipants ? "healthy" : "warning"}
        />
        <StatBlock
          label="Unsafe Roster"
          value={unsafeRosterPlayers}
          tone={unsafeRosterPlayers > 0 ? "danger" : "healthy"}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <StatBlock
          label="Mapped Teams"
          value={mappedTeams}
          tone={mappedTeams >= 2 ? "healthy" : "warning"}
        />
        <StatBlock
          label="Roster Safe Teams"
          value={rosterSafeTeams}
          tone={rosterSafeTeams >= 2 ? "healthy" : "warning"}
        />
      </div>

      <div className={`mt-5 rounded-2xl border p-4 ${toneStyle(blockCopy.tone)}`}>
        <p className="text-xs font-black uppercase tracking-[0.16em]">{blockCopy.title}</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{blockCopy.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={blockCopy.actionHref} className="text-sm font-black transition hover:text-white">{blockCopy.actionLabel} -&gt;</Link>
          <Link href={`/admin/pubg/imports/${encodeURIComponent(row.external_match_id)}`} className="btn-secondary px-4 py-2 text-xs">View Import Detail</Link>
          <Link href="/admin/rosters/health" className="text-sm font-black transition hover:text-white">Roster Health -&gt;</Link>
        </div>
      </div>
    </article>
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
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[1fr_0.8fr_0.8fr_1.3fr]">
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

export default async function PubgImportsPage() {
  const [
    rawImports,
    apiJobs,
    pubgMatches,
    pubgParticipants,
    pubgMappings,
    readinessResult,
    latestJobsResult,
  ] = await Promise.all([
    safeCount("raw_esports_imports"),
    safeCount("api_import_jobs"),
    safeCount("pubg_api_matches"),
    safeCount("pubg_api_participants"),
    safeCount("pubg_player_mappings"),

    supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select(
        "external_match_id, shard, map_name, game_mode, created_at_api, total_participants, mapped_players, mapped_players_with_team, mapped_teams, mapped_player_percentage, promotion_status, promotion_allowed, roster_safe_players, roster_safe_teams, unmapped_players, unsafe_roster_players, ai_participants, human_participants"
      )
      .order("created_at_api", { ascending: false })
      .limit(50),

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
  const latestJobs = (latestJobsResult.data || []) as ApiImportJob[];

  const readyCount = readinessRows.filter(
    (row) => row.promotion_allowed === true
  ).length;

  const blockedCount = readinessRows.filter(
    (row) => row.promotion_allowed !== true
  ).length;

  const rejectedPublicMatchCount = readinessRows.filter(
    (row) => row.promotion_status === "not_ready_contains_ai_participants"
  ).length;

  const totalParticipants = readinessRows.reduce(
    (sum, row) => sum + n(row.total_participants),
    0
  );

  const mappedPlayers = readinessRows.reduce(
    (sum, row) => sum + n(row.mapped_players),
    0
  );

  const aiParticipants = readinessRows.reduce(
    (sum, row) => sum + n(row.ai_participants),
    0
  );

  const tableErrorEntries: Array<[string, string | null | undefined]> = [
    ["raw_esports_imports", rawImports.error],
    ["api_import_jobs", apiJobs.error],
    ["pubg_api_matches", pubgMatches.error],
    ["pubg_api_participants", pubgParticipants.error],
    ["pubg_player_mappings", pubgMappings.error],
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
                <DataSourceBadge label="PUBG Imports" size="md" />
                <DataSourceBadge label="Promotion Gate" size="md" />
                <DataSourceBadge label="AI Rejection" size="md" />
              </div>

              <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                PUBG Import
                <br />
                Review
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Review imported PUBG API matches, readiness status, AI/public
                match rejection, mapping coverage, blocked reasons and recent
                import jobs before any core promotion.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/pubg/import"
                  className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                >
                  Import Match
                </Link>

                <Link
                  href="/admin/pubg"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  PUBG Hub
                </Link>

                <Link
                  href="/admin/pubg/mappings"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Player Mappings
                </Link>

                <Link
                  href="/admin/data-health"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Data Health
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Imported" value={readinessRows.length} />
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
              <StatBlock
                label="Rejected Public"
                value={rejectedPublicMatchCount}
                tone={rejectedPublicMatchCount > 0 ? "danger" : "healthy"}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Coverage"
            title="Import Mapping Coverage"
            actionHref="/admin/pubg/mappings"
            actionLabel="Open Mappings"
          />

          <div className="grid gap-3">
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
              label="Mapped Players"
              value={mappedPlayers}
              tone={mappedPlayers > 0 ? "healthy" : "warning"}
            />
            <StatBlock
              label="AI Participants"
              value={aiParticipants}
              tone={aiParticipants > 0 ? "danger" : "healthy"}
            />
            <StatBlock
              label="Mappings"
              value={pubgMappings.count}
              tone={pubgMappings.count > 0 ? "healthy" : "warning"}
            />
            <StatBlock label="Total Participants" value={totalParticipants} />
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Promotion Logic"
            title="What Blocks Promotion?"
          />

          <div className="grid gap-3">
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                Public Match Rejection
              </p>

              <p className="mt-3 text-sm leading-6 text-white/60">
                Any match containing AI participants is treated as a public or
                non-esports import and is blocked from PlayRank core promotion.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                Identity Mapping
              </p>

              <p className="mt-3 text-sm leading-6 text-white/50">
                PUBG account IDs and imported player names must be mapped to
                existing verified PlayRank player records.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                Team Safety
              </p>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Mapped players must have safe team linkage through active roster
                records before promotion.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
                Core Protection
              </p>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Imported rows stay in staging until promotion_allowed is true in
                the readiness view.
              </p>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Imported Matches"
            title="Promotion Readiness"
          />

          {readinessRows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="font-black text-white">No imported matches found.</p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Import a PUBG match first, then return here to review readiness.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {readinessRows.map((row) => (
                <ReadinessCard key={row.external_match_id} row={row} />
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="border-y border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <SectionHeader eyebrow="Recent Activity" title="Import Jobs" />

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
        <SectionHeader eyebrow="Errors" title="Import Review Access Report" />

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
              No import review table errors detected.
            </p>

            <p className="mt-2 text-sm text-white/55">
              Import readiness, mapping and job tables responded successfully.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}


