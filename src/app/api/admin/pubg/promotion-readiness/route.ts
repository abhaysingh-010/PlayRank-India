import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const PROMOTION_STATUS_FILTERS = [
  "already_promoted",
  "not_ready_contains_ai_participants",
  "not_ready_inactive_mapped_players",
  "not_ready_inactive_mapped_teams",
  "not_ready_invalid_winner_roster_count",
  "not_ready_multi_roster_participants",
  "not_ready_raw_import_unprocessed",
  "not_ready_too_few_human_participants",
  "not_ready_unlinked_participants",
  "not_ready_unmapped_players",
  "not_ready_unmapped_teams",
  "not_ready_unverified_player_mappings",
  "not_ready_unsafe_roster_players",
] as const;

const SUPPORTED_STATUS_FILTERS = [
  "all",
  "ready",
  "blocked",
  "rejected_public",
  ...PROMOTION_STATUS_FILTERS,
] as const;

type ReadinessStatus = (typeof SUPPORTED_STATUS_FILTERS)[number];
type PromotionStatusFilter = (typeof PROMOTION_STATUS_FILTERS)[number];

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

const MAX_LIMIT = 100;

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function parseLimit(value: string | null) {
  const parsed = Math.floor(n(value, 50));

  if (parsed < 1) return 50;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;

  return parsed;
}

function isSupportedStatus(value: string): value is ReadinessStatus {
  return (SUPPORTED_STATUS_FILTERS as readonly string[]).includes(value);
}

function isPromotionStatusFilter(
  value: ReadinessStatus,
): value is PromotionStatusFilter {
  return (PROMOTION_STATUS_FILTERS as readonly string[]).includes(value);
}

function parseStatus(value: string | null) {
  if (!value) {
    return {
      ok: true as const,
      status: "all" as ReadinessStatus,
    };
  }

  if (isSupportedStatus(value)) {
    return {
      ok: true as const,
      status: value,
    };
  }

  return {
    ok: false as const,
    payload: {
      ok: false,
      error: "Invalid status filter",
      supported_status_filters: SUPPORTED_STATUS_FILTERS,
    },
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function methodNotAllowed() {
  return jsonResponse(
    {
      ok: false,
      error: "Method not allowed",
      allowed_methods: ["GET"],
    },
    405,
  );
}

function getStatusBreakdown(rows: PromotionReadinessRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.promotion_status || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsedStatus = parseStatus(searchParams.get("status"));

  if (!parsedStatus.ok) {
    return jsonResponse(parsedStatus.payload, 400);
  }

  const status = parsedStatus.status;
  const limit = parseLimit(searchParams.get("limit"));

  let query = supabaseAdmin
    .from("pubg_match_promotion_readiness")
    .select(
      "external_match_id, shard, map_name, game_mode, created_at_api, total_participants, mapped_players, mapped_players_with_team, mapped_teams, mapped_player_percentage, promotion_status, promotion_allowed, roster_safe_players, roster_safe_teams, unmapped_players, unsafe_roster_players, ai_participants, human_participants",
    )
    .order("created_at_api", { ascending: false })
    .limit(limit);

  if (status === "ready") {
    query = query.eq("promotion_allowed", true);
  }

  if (status === "blocked") {
    query = query.or("promotion_allowed.is.false,promotion_allowed.is.null");
  }

  if (status === "rejected_public") {
    query = query.eq("promotion_status", "not_ready_contains_ai_participants");
  }

  if (isPromotionStatusFilter(status)) {
    query = query.eq("promotion_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to fetch PUBG promotion readiness",
      },
      500,
    );
  }

  const rows = (data || []) as PromotionReadinessRow[];

  const readyForPromotion = rows.filter(
    (row) => row.promotion_allowed === true,
  ).length;

  const blocked = rows.filter((row) => row.promotion_allowed !== true).length;

  const rejectedPublicMatches = rows.filter(
    (row) => row.promotion_status === "not_ready_contains_ai_participants",
  ).length;

  const totalParticipants = rows.reduce(
    (sum, row) => sum + n(row.total_participants),
    0,
  );

  const humanParticipants = rows.reduce(
    (sum, row) => sum + n(row.human_participants),
    0,
  );

  const aiParticipants = rows.reduce(
    (sum, row) => sum + n(row.ai_participants),
    0,
  );

  const mappedPlayers = rows.reduce(
    (sum, row) => sum + n(row.mapped_players),
    0,
  );

  const mappedPlayersWithTeam = rows.reduce(
    (sum, row) => sum + n(row.mapped_players_with_team),
    0,
  );

  const mappedTeams = rows.reduce((sum, row) => sum + n(row.mapped_teams), 0);

  const rosterSafePlayers = rows.reduce(
    (sum, row) => sum + n(row.roster_safe_players),
    0,
  );

  const rosterSafeTeams = rows.reduce(
    (sum, row) => sum + n(row.roster_safe_teams),
    0,
  );

  const unmappedPlayers = rows.reduce(
    (sum, row) => sum + n(row.unmapped_players),
    0,
  );

  const unsafeRosterPlayers = rows.reduce(
    (sum, row) => sum + n(row.unsafe_roster_players),
    0,
  );

  const summary = {
    returned_matches: rows.length,
    ready_for_promotion: readyForPromotion,
    blocked,
    rejected_public_matches: rejectedPublicMatches,

    total_participants: totalParticipants,
    human_participants: humanParticipants,
    ai_participants: aiParticipants,

    mapped_players: mappedPlayers,
    mapped_players_with_team: mappedPlayersWithTeam,
    mapped_teams: mappedTeams,

    roster_safe_players: rosterSafePlayers,
    roster_safe_teams: rosterSafeTeams,

    unmapped_players: unmappedPlayers,
    unsafe_roster_players: unsafeRosterPlayers,

    mapping_percentage:
      totalParticipants > 0
        ? Math.round((mappedPlayers / totalParticipants) * 100)
        : 0,

    roster_safety_percentage:
      totalParticipants > 0
        ? Math.round((rosterSafePlayers / totalParticipants) * 100)
        : 0,

    status_breakdown: getStatusBreakdown(rows),
  };

  return jsonResponse({
    ok: true,
    filters: {
      status,
      limit,
      supported_status_filters: SUPPORTED_STATUS_FILTERS,
    },
    summary,
    matches: rows,
  });
}

export async function POST() {
  return methodNotAllowed();
}
