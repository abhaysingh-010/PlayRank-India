import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ReadinessStatus = "all" | "ready" | "blocked";

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
};

const MAX_LIMIT = 100;

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function parseLimit(value: string | null) {
  const parsed = n(value, 50);

  if (parsed < 1) return 50;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;

  return parsed;
}

function parseStatus(value: string | null): ReadinessStatus {
  if (value === "ready") return "ready";
  if (value === "blocked") return "blocked";

  return "all";
}

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const status = parseStatus(searchParams.get("status"));
  const limit = parseLimit(searchParams.get("limit"));

  let query = supabaseAdmin
    .from("pubg_match_promotion_readiness")
    .select("*")
    .order("created_at_api", { ascending: false })
    .limit(limit);

  if (status === "ready") {
    query = query.eq("promotion_allowed", true);
  }

  if (status === "blocked") {
    query = query.neq("promotion_allowed", true);
  }

  const { data, error } = await query;

  if (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to fetch PUBG promotion readiness",
        details: error.message,
      },
      500
    );
  }

  const rows = (data || []) as PromotionReadinessRow[];

  const readyForPromotion = rows.filter(
    (row) => row.promotion_allowed === true
  ).length;

  const blocked = rows.filter((row) => row.promotion_allowed !== true).length;

  const totalParticipants = rows.reduce(
    (sum, row) => sum + n(row.total_participants),
    0
  );

  const mappedPlayers = rows.reduce(
    (sum, row) => sum + n(row.mapped_players),
    0
  );

  const mappedTeams = rows.reduce((sum, row) => sum + n(row.mapped_teams), 0);

  const summary = {
    returned_matches: rows.length,
    ready_for_promotion: readyForPromotion,
    blocked,
    total_participants: totalParticipants,
    mapped_players: mappedPlayers,
    mapped_teams: mappedTeams,
    mapping_percentage:
      totalParticipants > 0
        ? Math.round((mappedPlayers / totalParticipants) * 100)
        : 0,
  };

  return jsonResponse({
    ok: true,
    filters: {
      status,
      limit,
    },
    summary,
    matches: rows,
  });
}