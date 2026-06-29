import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type EntityType = "team" | "player";

type RankingHistoryRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  rank: number;
  score: number;
  snapshot_date: string | null;
  created_at: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
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
        error: "Invalid entity type",
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
      },
      500
    );
  }

  return jsonResponse((data || []) as RankingHistoryRow[]);
}