import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Tone = "neutral" | "healthy" | "warning" | "danger";

type RosterHealthRow = {
  player_id: string;
  ign: string;
  slug: string;
  player_team_id: string | null;
  player_team_name: string | null;
  active_roster_count: number | null;
  active_roster_team_id: string | null;
  active_roster_team_name: string | null;
  health_status: string;
  promotion_safe: boolean;
};

const shell =
  "rounded-[2rem] border border-white/10 bg-[#080a0f] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

const panel =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function getStatusTone(status: string): Tone {
  if (status === "healthy") return "healthy";

  if (
    status === "player_team_roster_mismatch" ||
    status === "multiple_active_rosters"
  ) {
    return "danger";
  }

  return "warning";
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

function toneLabel(tone: Tone) {
  if (tone === "healthy") return "Healthy";
  if (tone === "warning") return "Review";
  if (tone === "danger") return "Fix";
  return "Neutral";
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

function HealthBreakdownCard({
  label,
  value,
  description,
  tone = "neutral",
}: {
  label: string;
  value: number;
  description: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-black text-white">{label}</p>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
            tone
          )}`}
        >
          {value.toLocaleString("en-IN")}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}

function RosterHealthRowView({ row }: { row: RosterHealthRow }) {
  const tone = getStatusTone(row.health_status);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr_0.75fr] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
                tone
              )}`}
            >
              {toneLabel(tone)}
            </span>

            {row.promotion_safe ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                Promotion Safe
              </span>
            ) : (
              <span className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-300">
                Not Safe
              </span>
            )}
          </div>

          <Link
            href={`/players/${row.slug}`}
            className="mt-3 block truncate text-xl font-black tracking-[-0.04em] text-white transition hover:text-[#ffd21a]"
          >
            {row.ign}
          </Link>

          <p className="mt-1 text-xs text-white/35">{row.slug}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Player Team
          </p>

          <p className="mt-2 font-black text-white">
            {row.player_team_name || "None"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Active Roster Team
          </p>

          <p className="mt-2 font-black text-white">
            {row.active_roster_team_name || "None"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Active Rosters
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {n(row.active_roster_count)}
          </p>

          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/35">
            {formatStatus(row.health_status)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function AdminRosterHealthPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const selectedStatus = params.status || "all";

  const { data, error } = await supabaseAdmin
    .from("player_roster_health")
    .select("*")
    .order("promotion_safe", { ascending: true })
    .order("health_status", { ascending: true })
    .order("ign", { ascending: true });

  const rows = (data || []) as RosterHealthRow[];

  const healthy = rows.filter((row) => row.health_status === "healthy").length;
  const promotionSafe = rows.filter((row) => row.promotion_safe === true).length;
  const issues = rows.filter((row) => row.health_status !== "healthy").length;

  const noTeamNoRoster = rows.filter(
    (row) => row.health_status === "no_team_no_active_roster"
  ).length;

  const teamButNoRoster = rows.filter(
    (row) => row.health_status === "player_has_team_but_no_active_roster"
  ).length;

  const rosterButTeamMissing = rows.filter(
    (row) => row.health_status === "active_roster_but_player_team_missing"
  ).length;

  const mismatch = rows.filter(
    (row) => row.health_status === "player_team_roster_mismatch"
  ).length;

  const multipleActive = rows.filter(
    (row) => row.health_status === "multiple_active_rosters"
  ).length;

  const visibleRows = rows.filter((row) => {
    if (selectedStatus === "healthy") return row.health_status === "healthy";
    if (selectedStatus === "issues") return row.health_status !== "healthy";
    if (selectedStatus === "safe") return row.promotion_safe === true;
    if (selectedStatus === "blocked") return row.promotion_safe !== true;
    if (selectedStatus === "critical") {
      return (
        row.health_status === "player_team_roster_mismatch" ||
        row.health_status === "multiple_active_rosters"
      );
    }

    return true;
  });

  const filters = [
    { label: "All", value: "all" },
    { label: "Issues", value: "issues" },
    { label: "Critical", value: "critical" },
    { label: "Promotion Safe", value: "safe" },
    { label: "Blocked", value: "blocked" },
    { label: "Healthy", value: "healthy" },
  ];

  return (
    <main className="min-h-screen bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <DataSourceBadge label="Admin Console" size="md" />
                <DataSourceBadge label="Roster Health" size="md" />
                <DataSourceBadge label="Promotion Safety" size="md" />
              </div>

              <h1 className="mt-7 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                Roster
                <br />
                Health
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
                Validate player-team links, active roster records and PUBG
                promotion safety before imported player data reaches PlayRank
                core analytics.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin/rosters"
                  className="rounded-full border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-sm font-black text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                >
                  Roster Control
                </Link>

                <Link
                  href="/admin/pubg"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  PUBG Hub
                </Link>

                <Link
                  href="/admin/data-health"
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/65 transition hover:border-white/25 hover:text-white"
                >
                  Data Health
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
              <StatBlock label="Players Checked" value={rows.length} />
              <StatBlock
                label="Healthy"
                value={healthy}
                tone={issues === 0 ? "healthy" : "warning"}
              />
              <StatBlock
                label="Promotion Safe"
                value={promotionSafe}
                tone={promotionSafe > 0 ? "healthy" : "warning"}
              />
              <StatBlock
                label="Issues"
                value={issues}
                tone={issues === 0 ? "healthy" : "danger"}
              />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5">
            <p className="font-black uppercase text-red-300">
              Failed to load roster health
            </p>

            <p className="mt-3 text-sm text-white/60">{error.message}</p>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[0.85fr_1.15fr]">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Issue Breakdown"
            title="Roster Blockers"
          />

          <div className="grid gap-3">
            <HealthBreakdownCard
              label="No Team / No Roster"
              value={noTeamNoRoster}
              tone={noTeamNoRoster === 0 ? "healthy" : "warning"}
              description="Player has no team_id and no active roster record."
            />

            <HealthBreakdownCard
              label="Team / No Roster"
              value={teamButNoRoster}
              tone={teamButNoRoster === 0 ? "healthy" : "warning"}
              description="Player has team_id but no active roster record."
            />

            <HealthBreakdownCard
              label="Roster / Team Missing"
              value={rosterButTeamMissing}
              tone={rosterButTeamMissing === 0 ? "healthy" : "warning"}
              description="Player is on an active roster but player.team_id is missing."
            />

            <HealthBreakdownCard
              label="Team/Roster Mismatch"
              value={mismatch}
              tone={mismatch === 0 ? "healthy" : "danger"}
              description="Player team_id does not match the active roster team."
            />

            <HealthBreakdownCard
              label="Multiple Active Rosters"
              value={multipleActive}
              tone={multipleActive === 0 ? "healthy" : "danger"}
              description="Player has more than one active roster record."
            />
          </div>
        </section>

        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader
            eyebrow="Player Roster Audit"
            title="Health Records"
            actionHref="/admin/rosters"
            actionLabel="Open Roster Control"
          />

          <div className="mb-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Link
                key={filter.value}
                href={`/admin/rosters/health?status=${filter.value}`}
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                  selectedStatus === filter.value
                    ? "border-[#ffd21a]/40 bg-[#ffd21a]/10 text-[#ffd21a]"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <p className="mb-5 text-sm text-white/45">
            Showing {visibleRows.length.toLocaleString("en-IN")} of{" "}
            {rows.length.toLocaleString("en-IN")} players.
          </p>

          <div className="grid max-h-[900px] gap-4 overflow-y-auto pr-1">
            {visibleRows.length === 0 ? (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                <p className="font-black text-yellow-300">
                  No roster health records found.
                </p>

                <p className="mt-2 text-sm text-white/55">
                  Try another health filter or check whether the
                  player_roster_health view is returning rows.
                </p>
              </div>
            ) : null}

            {visibleRows.map((row) => (
              <RosterHealthRowView key={row.player_id} row={row} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}