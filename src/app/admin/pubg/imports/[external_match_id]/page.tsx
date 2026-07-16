import Link from "next/link";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    external_match_id: string;
  }>;
};

type AnyRecord = Record<string, unknown>;

function valueToText(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function getField(row: AnyRecord | null | undefined, keys: string[]) {
  if (!row) return "—";

  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== "") {
      return valueToText(value);
    }
  }

  return "—";
}

function getMatchMappingsHref(externalMatchId: string) {
  return `/admin/pubg/mappings?match=${encodeURIComponent(externalMatchId)}`;
}

function getPromotionReadinessHref(readiness: AnyRecord | null) {
  const status =
    typeof readiness?.promotion_status === "string"
      ? readiness.promotion_status
      : "blocked";

  return `/api/admin/pubg/promotion-readiness?status=${encodeURIComponent(
    status
  )}`;
}
function StatusBadge({
  status,
}: {
  status: "ready" | "blocked" | "unknown";
}) {
  const label =
    status === "ready"
      ? "Ready"
      : status === "blocked"
        ? "Blocked"
        : "Unknown";

  const className =
    status === "ready"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "blocked"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-300";

  return (
    <span className={`inline-flex border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function InfoCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="border border-white/10 bg-[#080a0f] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/30">{title}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-white/35">{helper}</p> : null}
    </div>
  );
}

function KeyValueTable({ data }: { data: AnyRecord | null }) {
  if (!data) {
    return (
      <div className="border border-white/10 bg-[#080a0f] p-6 text-sm text-white/40">
        No record found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-white/10">
      <table className="w-full text-left text-sm">
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="border-b border-white/10 last:border-b-0">
              <th className="w-64 bg-[#080a0f] px-4 py-3 font-medium text-white/40">
                {key}
              </th>
              <td className="bg-[#030406] px-4 py-3 text-white/70">
                {valueToText(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PubgImportDetailPage({ params }: PageProps) {
  const { external_match_id } = await params;
  const externalMatchId = decodeURIComponent(external_match_id);

  const [matchResult, participantsResult, readinessResult] = await Promise.all([
    supabaseAdmin
      .from("pubg_api_matches")
      .select("*")
      .eq("external_match_id", externalMatchId)
      .maybeSingle(),

    supabaseAdmin
      .from("pubg_api_participants")
      .select("*")
      .eq("external_match_id", externalMatchId)
      .order("kills", { ascending: false }),

    supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select("*")
      .eq("external_match_id", externalMatchId)
      .maybeSingle(),
  ]);

  const match = (matchResult.data ?? null) as AnyRecord | null;
  const participants = (participantsResult.data ?? []) as AnyRecord[];
  const readiness = (readinessResult.data ?? null) as AnyRecord | null;

  const promotionAllowed = readiness?.promotion_allowed === true;
  const promotionStatus = promotionAllowed
    ? "ready"
    : readiness
      ? "blocked"
      : "unknown";

  const PROMOTION_WRITE_STATUS =
    "Core promotion writes are guarded. Dry-run checks are allowed, but real promotion requires readiness, explicit confirmation, exact confirmation text, and PLAYRANK_ENABLE_PUBG_CORE_PROMOTION=true.";

  const PROMOTION_CONFIRMATION_TEXT = "PROMOTE_TO_PLAYRANK_CORE";

  const dryRunRequestBody = JSON.stringify(
    {
      external_match_id: externalMatchId,
      dry_run: true,
    },
    null,
    2
  );

  const confirmedPromotionRequestBody = JSON.stringify(
    {
      external_match_id: externalMatchId,
      dry_run: false,
      confirm_promotion: true,
      confirmation_text: PROMOTION_CONFIRMATION_TEXT,
    },
    null,
    2
  );

  const errors = [
    matchResult.error ? `Match: ${matchResult.error.message}` : null,
    participantsResult.error ? `Participants: ${participantsResult.error.message}` : null,
    readinessResult.error ? `Readiness: ${readinessResult.error.message}` : null,
  ].filter(Boolean);

  return (
    <main className="bg-[#030406] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-8">
        <div className="mb-4 border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
            Promotion safety mode
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {PROMOTION_WRITE_STATUS}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/admin/pubg/promotions" className="text-sm font-bold text-yellow-300 hover:text-yellow-200">
              Promotion Audit -&gt;
            </Link>
            <Link href="/admin/pubg/imports" className="text-sm font-bold text-zinc-300 hover:text-white">
              Import Review -&gt;
            </Link>
          </div>
        </div>

        <div className="mb-4 border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
            Dry-run vs confirmed promotion workflow
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-black text-emerald-300">
                Step 1: Run dry-run readiness check
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Dry-run validates readiness and returns would_promote without writing to PlayRank core tables.
              </p>
              <pre className="mt-3 overflow-auto border border-black/30 bg-black/30 p-3 text-xs leading-5 text-zinc-300">
                {dryRunRequestBody}
              </pre>
            </div>

            <div className="border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm font-black text-red-300">
                Step 2: Confirm promotion intent
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Confirmed promotion requires confirm_promotion, the exact confirmation_text, and the server flag PLAYRANK_ENABLE_PUBG_CORE_PROMOTION. Real writes execute only after the guarded server flag is enabled.
              </p>
              <pre className="mt-3 overflow-auto border border-black/30 bg-black/30 p-3 text-xs leading-5 text-zinc-300">
                {confirmedPromotionRequestBody}
              </pre>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Required confirmation text: <span className="font-black text-yellow-300">PROMOTE_TO_PLAYRANK_CORE</span>
          </p>

          <div className="mt-4 border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
              Audit and failure follow-up
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-300">
              After any confirmed attempt, review Promotion Audit for failed, blocked, started, and promoted states. Failed or started rows must remain in staging until error_message, completed_at, and core_match_id are reviewed.
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/admin/pubg/imports"
              className="text-sm font-medium text-red-400 hover:text-red-300"
            >
              ← Back to PUBG imports
            </Link>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              PUBG Import Detail
            </h1>

            <p className="mt-3 max-w-3xl text-sm text-zinc-400 md:text-base">
              Admin-only review page for imported PUBG match data, participants,
              readiness checks, and promotion safety.
            </p>

            <p className="mt-3 font-mono text-xs text-zinc-500">
              external_match_id: {externalMatchId}
            </p>
          </div>

          <div>
            <StatusBadge status={promotionStatus} />
          </div>
        </div>

        <div className="mb-6 border border-yellow-500/30 bg-yellow-500/10 p-5 text-sm text-yellow-200">
          PUBG core promotion is intentionally disabled until SQL safety is
          audited. This page is read-only and should not write to core
          PlayRank tables.
        </div>

        <div className="mb-6 flex flex-wrap gap-3 border border-white/10 bg-[#080a0f] p-5">
          <Link
            href={getMatchMappingsHref(externalMatchId)}
            className="border border-[#ffd21a]/30 bg-[#ffd21a]/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
          >
            Fix Match Mappings
          </Link>

          <Link
            href={getPromotionReadinessHref(readiness)}
            className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
          >
            Readiness Status
          </Link>

          <Link
            href="/admin/data-health/pubg-blocked-promotions"
            className="border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
          >
            Blocked Promotions
          </Link>
        </div>

        {errors.length > 0 ? (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
            <p className="font-semibold">Some data could not be loaded:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <InfoCard
            title="Promotion Status"
            value={promotionAllowed ? "Allowed" : "Blocked"}
            helper="Controlled by pubg_match_promotion_readiness."
          />

          <InfoCard
            title="Participants"
            value={String(participants.length)}
            helper="Imported PUBG participant rows."
          />

          <InfoCard
            title="Map"
            value={getField(match, ["map_name", "map", "mapName"])}
            helper="From staged PUBG match metadata."
          />

          <InfoCard
            title="Game Mode"
            value={getField(match, ["game_mode", "mode", "gameMode"])}
            helper="From staged PUBG match metadata."
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold">Promotion Readiness</h2>
            <KeyValueTable data={readiness} />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold">Match Metadata</h2>
            <KeyValueTable data={match} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Participants</h2>

          {participants.length === 0 ? (
            <div className="border border-white/10 bg-[#080a0f] p-6 text-sm text-white/40">
              No participants found for this external match id.
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#080a0f] text-xs uppercase tracking-[0.16em] text-white/30">
                  <tr>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3">Team / Roster</th>
                    <th className="px-4 py-3">Kills</th>
                    <th className="px-4 py-3">Damage</th>
                    <th className="px-4 py-3">Placement</th>
                    <th className="px-4 py-3">Raw ID</th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant, index) => (
                    <tr
                      key={`${getField(participant, ["id", "participant_id", "account_id"])}-${index}`}
                      className="border-t border-white/10 bg-[#030406]"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {getField(participant, [
                          "player_name",
                          "name",
                          "ign",
                          "pubg_name",
                          "account_name",
                        ])}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {getField(participant, [
                          "team_name",
                          "roster_name",
                          "clan_name",
                          "team",
                        ])}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {getField(participant, ["kills", "kill_count"])}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {getField(participant, ["damage", "damage_dealt", "damageDealt"])}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {getField(participant, ["placement", "rank", "win_place"])}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {getField(participant, ["id", "participant_id", "account_id"])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
