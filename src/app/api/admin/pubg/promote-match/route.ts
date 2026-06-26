import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MATCH_ID_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;

type PromoteBody = {
  external_match_id?: unknown;
};

type PromotionReadinessRow = {
  external_match_id: string;
  promotion_allowed: boolean | null;
  promotion_status: string | null;
  total_participants?: number | null;
  mapped_players?: number | null;
  mapped_players_with_team?: number | null;
  mapped_teams?: number | null;
  mapped_player_percentage?: number | null;
};

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function normalizeExternalMatchId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned;
}

function validateExternalMatchId(externalMatchId: string | null) {
  if (!externalMatchId) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Missing external_match_id",
        example: {
          external_match_id: "f89445ae-489c-4992-add6-9999f644d55e",
        },
      },
    };
  }

  if (!MATCH_ID_PATTERN.test(externalMatchId)) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Invalid external_match_id format",
      },
    };
  }

  return {
    ok: true as const,
    externalMatchId,
  };
}

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as PromoteBody;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);

    if (!body) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid JSON body",
          example: {
            external_match_id: "f89445ae-489c-4992-add6-9999f644d55e",
          },
        },
        400
      );
    }

    const externalMatchId = normalizeExternalMatchId(body.external_match_id);
    const validated = validateExternalMatchId(externalMatchId);

    if (!validated.ok) {
      return jsonResponse(validated.payload, validated.status);
    }

    const { data: readiness, error: readinessError } = await supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select("*")
      .eq("external_match_id", validated.externalMatchId)
      .maybeSingle();

    if (readinessError) {
      return jsonResponse(
        {
          ok: false,
          error: "Failed to read PUBG match readiness",
          details: readinessError.message,
          external_match_id: validated.externalMatchId,
        },
        500
      );
    }

    if (!readiness) {
      return jsonResponse(
        {
          ok: false,
          error: "PUBG match readiness record not found",
          external_match_id: validated.externalMatchId,
        },
        404
      );
    }

    const readinessRow = readiness as PromotionReadinessRow;

    if (readinessRow.promotion_allowed !== true) {
      return jsonResponse(
        {
          ok: false,
          promoted: false,
          blocked: true,
          error: "PUBG match is not ready for PlayRank core promotion",
          reason: readinessRow.promotion_status || "unknown",
          readiness: readinessRow,
        },
        409
      );
    }

    return jsonResponse(
      {
        ok: false,
        promoted: false,
        blocked: false,
        promotion_ready: true,
        error:
          "Promotion gate passed, but core promotion is intentionally disabled.",
        next_step:
          "Audit and install promote_pubg_api_match_to_playrank_core() before enabling actual promotion.",
        readiness: readinessRow,
      },
      501
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown promotion error";

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      500
    );
  }
}