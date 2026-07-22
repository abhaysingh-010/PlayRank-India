import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PromotionAuditRow = {
  id: string;
  external_match_id: string;
  core_match_id: string | null;
  status: string | null;
  result: unknown;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
};

type Tone = "neutral" | "healthy" | "warning" | "danger";

const shell =
  "border border-white/10 bg-[#080a0f] shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

function toneStyle(tone: Tone) {
  if (tone === "healthy") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }

  if (tone === "warning") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-300";
  }

  if (tone === "danger") {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-white/55";
}

function getStatusTone(status: string | null): Tone {
  if (status === "promoted") return "healthy";
  if (status === "failed") return "danger";
  if (status === "blocked") return "warning";
  return "neutral";
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

function getOperatorActionCopy(status: string | null) {
  if (status === "failed") {
    return {
      title: "Promotion failed: operator action required",
      description:
        "Inspect error_message and result payload before retrying. Keep the match in staging, repair mappings, roster health, or SQL data issues, then run dry-run again before any confirmed attempt.",
      tone: "danger" as Tone,
    };
  }

  if (status === "blocked") {
    return {
      title: "Promotion blocked by readiness guard",
      description:
        "Blocked means the promotion function rejected the attempt before core writes completed. Review readiness blockers, mapping coverage, roster safety, and AI participant signals before retrying.",
      tone: "warning" as Tone,
    };
  }

  if (status === "started") {
    return {
      title: "Started without completion",
      description:
        "A started audit row without completed_at may indicate an in-flight or interrupted attempt. Do not retry a real promotion until an operator confirms the database state and audit owner.",
      tone: "warning" as Tone,
    };
  }

  if (status === "promoted") {
    return {
      title: "Promotion completed",
      description:
        "Verify the core_match_id, inserted player stats, inserted team results, and downstream ranking effects before marking the promotion operationally closed.",
      tone: "healthy" as Tone,
    };
  }

  return {
    title: "Unknown audit state",
    description:
      "Treat unknown audit states as unsafe. Review the raw audit payload and keep the match in staging until the state is understood.",
    tone: "neutral" as Tone,
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
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

function AuditRow({ row }: { row: PromotionAuditRow }) {
  const resultText =
    row.result && typeof row.result === "object"
      ? JSON.stringify(row.result, null, 2)
      : String(row.result || "No result payload");

  const operatorAction = getOperatorActionCopy(row.status);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <DataSourceBadge label="Promotion Audit" />

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneStyle(
                getStatusTone(row.status),
              )}`}
            >
              {formatStatus(row.status)}
            </span>
          </div>

          <p className="mt-4 break-all text-sm font-black text-white">
            {row.external_match_id}
          </p>

          <p className="mt-2 text-xs text-white/35">
            Created {formatDate(row.created_at)} · Completed{" "}
            {formatDate(row.completed_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/pubg/imports/${encodeURIComponent(
              row.external_match_id,
            )}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
          >
            Import Detail
          </Link>

          <Link
            href={`/admin/pubg/mappings?match=${encodeURIComponent(
              row.external_match_id,
            )}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
          >
            Match Mappings
          </Link>
        </div>
      </div>

      {row.core_match_id ? (
        <p className="mt-4 break-all rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs font-black text-emerald-300">
          Core match: {row.core_match_id}
        </p>
      ) : null}

      {row.error_message ? (
        <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {row.error_message}
        </p>
      ) : null}

      <div
        className={`mt-4 rounded-2xl border p-3 ${toneStyle(operatorAction.tone)}`}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em]">
          {operatorAction.title}
        </p>

        <p className="mt-2 text-sm leading-6 text-white/65">
          {operatorAction.description}
        </p>
      </div>

      <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-5 text-white/50">
        {resultText}
      </pre>
    </div>
  );
}

export default async function PubgPromotionAuditPage() {
  const { data, error } = await supabaseAdmin
    .from("pubg_core_promotions")
    .select(
      "id, external_match_id, core_match_id, status, result, error_message, created_at, completed_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data || []) as PromotionAuditRow[];

  const promoted = rows.filter((row) => row.status === "promoted").length;
  const blocked = rows.filter((row) => row.status === "blocked").length;
  const failed = rows.filter((row) => row.status === "failed").length;
  const started = rows.filter((row) => row.status === "started").length;

  return (
    <main className="bg-[#030406] text-white">
      <section className="border-b border-white/10 bg-[#050609]">
        <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 md:py-14">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="Admin Console" size="md" />
            <DataSourceBadge label="PUBG Promotion Audit" size="md" />
            <DataSourceBadge label="Core Write Guard" size="md" />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-[#f4473b]">
            Core-write history / operator accountability
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
            PUBG Promotion
            <br />
            Audit Log
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-white/50">
            Review every attempted PUBG staging-to-core promotion before the
            core write path is enabled in the admin API.
          </p>

          <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
              Audit visibility before writes
            </p>

            <p className="mt-2 text-sm leading-6 text-white/65">
              SQL promotion function exists, and the admin API route calls it
              only after readiness, exact confirmation, and the server-side
              feature flag pass. Dry-run and locked responses still do not
              write.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd21a]">
              Failure-state operator guide
            </p>

            <div className="mt-3 grid gap-3 text-sm leading-6 text-white/60 md:grid-cols-2">
              <p>
                Failed: inspect error_message and result payload, repair the
                root cause, then rerun dry-run before retry.
              </p>
              <p>
                Blocked: readiness guard stopped the promotion; fix mapping,
                roster, AI, or team safety blockers first.
              </p>
              <p>
                Started: if completed_at is missing, treat the attempt as unsafe
                until database state is verified.
              </p>
              <p>
                Promoted: verify core_match_id, inserted stats, team results,
                and downstream ranking effects.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin/pubg"
              className="border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
            >
              PUBG Hub
            </Link>

            <Link
              href="/admin/pubg/imports"
              className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
            >
              Import Review
            </Link>

            <Link
              href="/admin/data-health/pubg-blocked-promotions"
              className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
            >
              Blocked Promotions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
        <section className={shell + " p-5 md:p-6"}>
          <SectionHeader eyebrow="Audit Status" title="Promotion Attempts" />

          <div className="grid gap-3 md:grid-cols-4">
            <StatBlock label="Promoted" value={promoted} tone="healthy" />
            <StatBlock label="Blocked" value={blocked} tone="warning" />
            <StatBlock label="Failed" value={failed} tone="danger" />
            <StatBlock label="Started" value={started} />
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <p className="font-black uppercase tracking-[0.16em] text-red-300">
                Audit table error
              </p>

              <p className="mt-2 text-sm text-white/60">{error.message}</p>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="font-black text-white">
                  No PUBG promotion audit rows found.
                </p>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  This is expected while the real core promotion write path
                  remains disabled.
                </p>
              </div>
            ) : (
              rows.map((row) => <AuditRow key={row.id} row={row} />)
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
