import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DataSourceBadge from "@/components/DataSourceBadge";

export const dynamic = "force-dynamic";

type PromotionReadinessRow = {
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

function formatStatus(value: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/^not_ready_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPromotionReadinessHref(status: string | null) {
  if (!status) {
    return "/api/admin/pubg/promotion-readiness?status=blocked";
  }

  return `/api/admin/pubg/promotion-readiness?status=${encodeURIComponent(status)}`;
}
function getBlockReason(row: PromotionReadinessRow) {
  if (n(row.ai_participants) > 0) {
    return "Contains AI/public participants";
  }

  if (n(row.unmapped_players) > 0) {
    return "Unmapped players";
  }

  if (n(row.unsafe_roster_players) > 0) {
    return "Unsafe roster links";
  }

  if (row.promotion_allowed !== true) {
    return row.promotion_status
      ? formatStatus(row.promotion_status)
      : "Promotion not allowed";
  }

  return "Ready";
}

function getPriority(row: PromotionReadinessRow) {
  if (n(row.ai_participants) > 0) {
    return {
      label: "Rejected",
      className: "border-red-400/25 bg-red-400/10 text-red-300",
    };
  }

  if (n(row.unmapped_players) > 0 || n(row.unsafe_roster_players) > 0) {
    return {
      label: "High",
      className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300",
    };
  }

  return {
    label: "Review",
    className: "border-white/10 bg-white/[0.04] text-white/55",
  };
}

export default async function PubgBlockedPromotionsPage() {
  const { data, error } = await supabaseAdmin
    .from("pubg_match_promotion_readiness")
    .select(
      "external_match_id, shard, map_name, game_mode, created_at_api, total_participants, mapped_players, mapped_players_with_team, mapped_teams, mapped_player_percentage, promotion_status, promotion_allowed, roster_safe_players, roster_safe_teams, unmapped_players, unsafe_roster_players, ai_participants, human_participants"
    )
    .or("promotion_allowed.is.false,promotion_allowed.is.null")
    .order("created_at_api", { ascending: false })
    .limit(250);

  const rows = (data || []) as PromotionReadinessRow[];

  const aiBlockedCount = rows.filter((row) => n(row.ai_participants) > 0).length;
  const unmappedPlayerCount = rows.reduce(
    (sum, row) => sum + n(row.unmapped_players),
    0
  );
  const unsafeRosterCount = rows.reduce(
    (sum, row) => sum + n(row.unsafe_roster_players),
    0
  );
  const totalParticipants = rows.reduce(
    (sum, row) => sum + n(row.total_participants),
    0
  );
  const mappedPlayers = rows.reduce(
    (sum, row) => sum + n(row.mapped_players),
    0
  );

  const mappingPercentage =
    totalParticipants > 0
      ? Math.round((mappedPlayers / totalParticipants) * 100)
      : 0;

  if (error) {
    return (
      <main className="page-shell py-10 text-white">
        <section className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Admin Data Health
          </p>
          <h1 className="mt-3 text-3xl font-black">PUBG Blocked Promotions</h1>
          <p className="mt-3 text-red-200/80">
            Failed to load blocked promotion records.
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
              <DataSourceBadge label="PUBG Blocked Promotions" />
              <DataSourceBadge label="Promotion Gate" />
              <DataSourceBadge label="Core Safety" />
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
              Data Issue Detail
            </p>

            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-7xl">
              Blocked
              <br />
              Promotions
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50">
              These PUBG API matches are blocked from PlayRank core promotion.
              Fix player mappings, roster safety, and public/AI participant
              issues before enabling any core promotion path.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Blocked Matches
              </p>
              <p className="mt-2 text-3xl font-black text-[#ffd21a]">
                {rows.length.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                AI/Public Blocks
              </p>
              <p className="mt-2 text-3xl font-black text-red-300">
                {aiBlockedCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Unmapped Players
              </p>
              <p className="mt-2 text-3xl font-black">
                {unmappedPlayerCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Unsafe Roster
              </p>
              <p className="mt-2 text-3xl font-black text-orange-300">
                {unsafeRosterCount.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Mapping Coverage
              </p>
              <p className="mt-2 text-3xl font-black">
                {mappingPercentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/admin/data-health" className="btn-secondary px-5 py-3 text-sm">Back to Data Health</Link>
          <Link href="/admin/pubg/mappings" className="btn-primary px-5 py-3 text-sm">Fix Player Mappings</Link>
          <Link href="/admin/pubg/imports" className="btn-secondary px-5 py-3 text-sm">PUBG Imports</Link>
          <Link href="/admin/pubg" className="btn-secondary px-5 py-3 text-sm">PUBG Admin</Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-6">
        <div className="flex flex-wrap gap-2">
          <DataSourceBadge label="Promotion Disabled" />
          <DataSourceBadge label="Safety First" />
          <DataSourceBadge label="Manual Review Required" />
        </div>

        <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em]">
          Do not bypass promotion readiness
        </h2>

        <p className="mt-3 max-w-5xl text-sm leading-7 text-white/55">
          Blocked PUBG matches should stay in staging until readiness issues are
          resolved. Core promotion should remain disabled until the SQL
          promotion function is audited for idempotency, roster safety,
          duplicate prevention and transactional integrity.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-black">Blocked Matches</h2>
          <p className="mt-2 text-sm text-white/45">
            Review blocked reasons before mapping or promotion work. Public/AI
            participant matches should generally remain rejected.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.025] text-xs uppercase tracking-[0.22em] text-white/35">
                <th className="px-6 py-4">Match</th>
                <th className="px-6 py-4">Map</th>
                <th className="px-6 py-4 text-right">Participants</th>
                <th className="px-6 py-4 text-right">Mapped</th>
                <th className="px-6 py-4 text-right">Unmapped</th>
                <th className="px-6 py-4 text-right">Unsafe Roster</th>
                <th className="px-6 py-4 text-right">AI/Public</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const priority = getPriority(row);

                  return (
                    <tr
                      key={row.external_match_id}
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-5">
                        <code className="block max-w-[240px] truncate rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/60">
                          {row.external_match_id}
                        </code>
                        <p className="mt-2 text-xs text-white/35">
                          {formatDate(row.created_at_api)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-white">
                          {row.map_name || "Unknown Map"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">
                          {row.game_mode || "mode"} Â· {row.shard || "shard"}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-right text-white/65">
                        {n(row.total_participants)}
                      </td>

                      <td className="px-6 py-5 text-right text-white/65">
                        {n(row.mapped_players)}
                      </td>

                      <td className="px-6 py-5 text-right font-black text-yellow-300">
                        {n(row.unmapped_players)}
                      </td>

                      <td className="px-6 py-5 text-right font-black text-orange-300">
                        {n(row.unsafe_roster_players)}
                      </td>

                      <td className="px-6 py-5 text-right font-black text-red-300">
                        {n(row.ai_participants)}
                      </td>

                      <td className="px-6 py-5 text-sm text-white/55">
                        {getBlockReason(row)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/admin/pubg/imports/${encodeURIComponent(
                              row.external_match_id
                            )}`}
                            className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-300 hover:text-red-200"
                          >
                            Review import
                          </Link>

                                                    <Link
                            href={`/admin/pubg/mappings?match=${encodeURIComponent(
                              row.external_match_id
                            )}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 transition hover:border-[#ffd21a]/30 hover:text-[#ffd21a]"
                          >
                            Fix mappings
                          </Link>

                          <Link
                            href={getPromotionReadinessHref(row.promotion_status)}
                            className="rounded-full border border-[#ffd21a]/20 bg-[#ffd21a]/10 px-4 py-2 text-sm font-bold text-[#ffd21a] transition hover:bg-[#ffd21a]/15"
                          >
                            Readiness filter
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <p className="text-lg font-black text-emerald-300">
                      No blocked PUBG promotions found.
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                      Promotion readiness records are currently clean.
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


