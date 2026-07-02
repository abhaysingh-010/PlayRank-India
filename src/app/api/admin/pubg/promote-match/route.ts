import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MATCH_ID_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;
const PROMOTION_CONFIRMATION_TEXT = "PROMOTE_TO_PLAYRANK_CORE";
const PROMOTION_ENV_FLAG = "PLAYRANK_ENABLE_PUBG_CORE_PROMOTION";

type PromoteBody = {
  external_match_id?: unknown;
  dry_run?: unknown;
  confirm_promotion?: unknown;
  confirmation_text?: unknown;
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
  roster_safe_players?: number | null;
  roster_safe_teams?: number | null;
  unmapped_players?: number | null;
  unsafe_roster_players?: number | null;
  ai_participants?: number | null;
  human_participants?: number | null;
};

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
      allowed_methods: ["POST"],
    },
    405
  );
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

function normalizeDryRun(value: unknown) {
  return value === true;
}

function normalizeConfirmPromotion(value: unknown) {
  return value === true;
}

function normalizeConfirmationText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isCorePromotionEnabled() {
  return process.env[PROMOTION_ENV_FLAG] === "true";
}

function validateExternalMatchId(externalMatchId: string | null) {
  if (!externalMatchId) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Missing external_match_id",
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

function getReadinessSummary(row: PromotionReadinessRow) {
  return {
    external_match_id: row.external_match_id,
    promotion_allowed: row.promotion_allowed,
    promotion_status: row.promotion_status,
    total_participants: row.total_participants ?? null,
    mapped_players: row.mapped_players ?? null,
    mapped_players_with_team: row.mapped_players_with_team ?? null,
    mapped_teams: row.mapped_teams ?? null,
    mapped_player_percentage: row.mapped_player_percentage ?? null,
    roster_safe_players: row.roster_safe_players ?? null,
    roster_safe_teams: row.roster_safe_teams ?? null,
    unmapped_players: row.unmapped_players ?? null,
    unsafe_roster_players: row.unsafe_roster_players ?? null,
    ai_participants: row.ai_participants ?? null,
    human_participants: row.human_participants ?? null,
  };
}

export async function GET() {
  return methodNotAllowed();
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);

    if (!body) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid JSON body",
        },
        400
      );
    }

    const externalMatchId = normalizeExternalMatchId(body.external_match_id);
    const validated = validateExternalMatchId(externalMatchId);

    if (!validated.ok) {
      return jsonResponse(validated.payload, validated.status);
    }

    const dryRun = normalizeDryRun(body.dry_run);
    const confirmPromotion = normalizeConfirmPromotion(body.confirm_promotion);
    const confirmationText = normalizeConfirmationText(body.confirmation_text);

    const { data: readiness, error: readinessError } = await supabaseAdmin
      .from("pubg_match_promotion_readiness")
      .select(
        "external_match_id, promotion_allowed, promotion_status, total_participants, mapped_players, mapped_players_with_team, mapped_teams, mapped_player_percentage, roster_safe_players, roster_safe_teams, unmapped_players, unsafe_roster_players, ai_participants, human_participants"
      )
      .eq("external_match_id", validated.externalMatchId)
      .maybeSingle();

    if (readinessError) {
      return jsonResponse(
        {
          ok: false,
          error: "Failed to read PUBG match readiness",
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
    const readinessSummary = getReadinessSummary(readinessRow);

    if (readinessRow.promotion_allowed !== true) {
      return jsonResponse(
        {
          ok: false,
          promoted: false,
          blocked: true,
          error: "PUBG match is not ready for PlayRank core promotion",
          reason: readinessRow.promotion_status || "unknown",
          readiness: readinessSummary,
        },
        409
      );
    }

    if (dryRun) {
      return jsonResponse(
        {
          ok: true,
          promoted: false,
          blocked: false,
          dry_run: true,
          promotion_ready: true,
          would_promote: true,
          core_promotion_disabled: true,
          message:
            "Dry run passed. Promotion gate is ready, but no core write was executed.",
          next_step:
            "Review SQL safety audit before enabling PlayRank core promotion.",
          readiness: readinessSummary,
        },
        200
      );
    }

    if (!confirmPromotion) {
      return jsonResponse(
        {
          ok: false,
          promoted: false,
          blocked: false,
          dry_run: false,
          promotion_ready: true,
          core_promotion_disabled: true,
          confirmation_required: true,
          error: "Explicit promotion confirmation is required.",
          required_confirmation_text: PROMOTION_CONFIRMATION_TEXT,
          next_step:
            "Run a dry-run check first, then confirm promotion explicitly.",
          readiness: readinessSummary,
        },
        423
      );
    }

    if (confirmationText !== PROMOTION_CONFIRMATION_TEXT) {
      return jsonResponse(
        {
          ok: false,
          promoted: false,
          blocked: false,
          dry_run: false,
          promotion_ready: true,
          core_promotion_disabled: true,
          confirmation_required: true,
          error: "Promotion confirmation text did not match.",
          required_confirmation_text: PROMOTION_CONFIRMATION_TEXT,
          next_step:
            "Use the exact confirmation text before enabling a real promotion request.",
          readiness: readinessSummary,
        },
        423
      );
    }

    if (!isCorePromotionEnabled()) {
      return jsonResponse(
        {
          ok: false,
          promoted: false,
          blocked: false,
          dry_run: false,
          promotion_ready: true,
          core_promotion_disabled: true,
          promotion_env_flag: PROMOTION_ENV_FLAG,
          error:
            "Promotion confirmed, but the server-side promotion feature flag is disabled.",
          next_step:
            "Set PLAYRANK_ENABLE_PUBG_CORE_PROMOTION=true only after rollout approval.",
          readiness: readinessSummary,
        },
        423
      );
    }

    return jsonResponse(
      {
        ok: false,
        promoted: false,
        blocked: false,
        dry_run: false,
        promotion_ready: true,
        core_promotion_disabled: true,
        promotion_env_flag: PROMOTION_ENV_FLAG,
        error:
          "Promotion gate passed and confirmation was accepted, but the SQL RPC call is still disabled in this phase.",
        next_step:
          "Phase 4A will enable the SQL RPC call behind this guarded contract.",
        readiness: readinessSummary,
      },
      423
    );
  } catch {
    return jsonResponse(
      {
        ok: false,
        error: "Unexpected promotion safety check failure",
      },
      500
    );
  }
}
