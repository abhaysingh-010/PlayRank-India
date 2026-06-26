import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type EntityType = "team" | "player";
type Trend = "up" | "down" | "stable";
type StreakType = "win" | "loss" | "none";

type RankingHistoryRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  rank: number;
  score: number;
  snapshot_date: string | null;
  created_at: string | null;
};

type MatchResult = {
  result?: "win" | "loss" | string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function isEntityType(value: string): value is EntityType {
  return value === "team" || value === "player";
}

function parseLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 180;
  if (parsed < 1) return 180;
  if (parsed > 365) return 365;

  return Math.floor(parsed);
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      entityType: string;
      id: string;
    }>;
  }
) {
  const { entityType, id } = await context.params;
  const { searchParams } = new URL(request.url);

  if (!isEntityType(entityType)) {
    return jsonResponse(
      {
        ok: false,
        error: "Invalid entityType",
        allowed_entity_types: ["team", "player"],
      },
      400
    );
  }

  if (!UUID_PATTERN.test(id)) {
    return jsonResponse(
      {
        ok: false,
        error: "Invalid entity id",
      },
      400
    );
  }

  const limit = parseLimit(searchParams.get("limit"));

  const { data, error } = await supabase
    .from("ranking_history")
    .select("id, entity_type, entity_id, rank, score, snapshot_date, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .order("snapshot_date", { ascending: true })
    .limit(limit);

  if (error) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to load ranking history",
        details: error.message,
      },
      500
    );
  }

  return jsonResponse((data || []) as RankingHistoryRow[]);
}

export function calculateMomentum(history: RankingHistoryRow[]) {
  if (!history || history.length < 2) {
    return {
      momentum: 0,
      trend: "stable" as Trend,
      change: 0,
    };
  }

  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  const diff = prev.rank - last.rank;
  const momentum = diff * 10 + (last.score || 0) * 0.05;

  let trend: Trend = "stable";

  if (diff > 0) trend = "up";
  else if (diff < 0) trend = "down";

  return {
    momentum: Math.round(momentum),
    trend,
    change: diff,
  };
}

export function calculateStreak(matches: MatchResult[]) {
  if (!matches || matches.length === 0) {
    return {
      streak: 0,
      type: "none" as StreakType,
    };
  }

  let streak = 0;
  let type: Exclude<StreakType, "none"> | null = null;

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const isWin = match.result === "win";

    if (type === null) {
      type = isWin ? "win" : "loss";
      streak = 1;
    } else if ((type === "win" && isWin) || (type === "loss" && !isWin)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    streak,
    type: type || ("none" as StreakType),
  };
}

export function detectForm(momentum: number) {
  if (momentum >= 50) return "HOT";
  if (momentum >= 20) return "WARM";
  if (momentum >= 0) return "NEUTRAL";

  return "COLD";
}