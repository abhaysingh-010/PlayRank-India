import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RosterHealthStatus =
  | "all"
  | "healthy"
  | "issues"
  | "safe"
  | "blocked"
  | "no_team_no_active_roster"
  | "player_has_team_but_no_active_roster"
  | "active_roster_but_player_team_missing"
  | "player_team_roster_mismatch"
  | "multiple_active_rosters";

type RosterHealthRow = {
  player_id: string;
  ign: string;
  slug: string;
  player_team_id: string | null;
  player_team_name: string | null;
  active_roster_count: number | null;
  active_roster_team_id: string | null;
  active_roster_team_name: string | null;
  health_status: string | null;
  promotion_safe: boolean | null;
};

const MAX_LIMIT = 200;

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function parseLimit(value: string | null) {
  const parsed = n(value, 100);

  if (parsed < 1) return 100;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;

  return parsed;
}

function parseStatus(value: string | null): RosterHealthStatus {
  const allowedStatuses: RosterHealthStatus[] = [
    "all",
    "healthy",
    "issues",
    "safe",
    "blocked",
    "no_team_no_active_roster",
    "player_has_team_but_no_active_roster",
    "active_roster_but_player_team_missing",
    "player_team_roster_mismatch",
    "multiple_active_rosters",
  ];

  if (allowedStatuses.includes(value as RosterHealthStatus)) {
    return value as RosterHealthStatus;
  }

  return "all";
}

function buildSummary(rows: RosterHealthRow[]) {
  const healthy = rows.filter((row) => row.health_status === "healthy").length;
  const promotionSafe = rows.filter(
    (row) => row.promotion_safe === true
  ).length;
  const issues = rows.filter((row) => row.health_status !== "healthy").length;

  return {
    returned_players: rows.length,
    healthy,
    promotion_safe: promotionSafe,
    blocked: rows.length - promotionSafe,
    issues,
    no_team_no_active_roster: rows.filter(
      (row) => row.health_status === "no_team_no_active_roster"
    ).length,
    player_has_team_but_no_active_roster: rows.filter(
      (row) => row.health_status === "player_has_team_but_no_active_roster"
    ).length,
    active_roster_but_player_team_missing: rows.filter(
      (row) => row.health_status === "active_roster_but_player_team_missing"
    ).length,
    player_team_roster_mismatch: rows.filter(
      (row) => row.health_status === "player_team_roster_mismatch"
    ).length,
    multiple_active_rosters: rows.filter(
      (row) => row.health_status === "multiple_active_rosters"
    ).length,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const status = parseStatus(searchParams.get("status"));
  const limit = parseLimit(searchParams.get("limit"));

  let query = supabaseAdmin
    .from("player_roster_health")
    .select("*")
    .order("promotion_safe", { ascending: true })
    .order("health_status", { ascending: true })
    .order("ign", { ascending: true })
    .limit(limit);

  if (status === "healthy") {
    query = query.eq("health_status", "healthy");
  }

  if (status === "issues") {
    query = query.neq("health_status", "healthy");
  }

  if (status === "safe") {
    query = query.eq("promotion_safe", true);
  }

  if (status === "blocked") {
    query = query.neq("promotion_safe", true);
  }

  if (
    status === "no_team_no_active_roster" ||
    status === "player_has_team_but_no_active_roster" ||
    status === "active_roster_but_player_team_missing" ||
    status === "player_team_roster_mismatch" ||
    status === "multiple_active_rosters"
  ) {
    query = query.eq("health_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to fetch roster health",
        details: error.message,
      },
      500
    );
  }

  const rows = (data || []) as RosterHealthRow[];

  return jsonResponse({
    ok: true,
    filters: {
      status,
      limit,
    },
    summary: buildSummary(rows),
    rows,
  });
}