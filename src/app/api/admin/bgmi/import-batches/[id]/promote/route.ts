import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const CONFIRMATION_TEXT = "PROMOTE_BGMI_BATCH";
const FEATURE_FLAG = "PLAYRANK_ENABLE_BGMI_BATCH_PROMOTION";

type PromotionResult = {
  ok?: boolean;
  promoted?: boolean;
  already_promoted?: boolean;
  reason?: string;
  matches?: number;
  team_results?: number;
  player_stats?: number;
};

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    confirmationText?: unknown;
  } | null;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return json({ ok: false, error: "Invalid batch ID" }, 400);
  }

  if (body?.confirmationText !== CONFIRMATION_TEXT) {
    return json(
      {
        ok: false,
        error: "Enter the exact confirmation text before promotion.",
        requiredConfirmationText: CONFIRMATION_TEXT,
      },
      423,
    );
  }

  if (process.env[FEATURE_FLAG] !== "true") {
    return json(
      {
        ok: false,
        error: "BGMI batch promotion is disabled on this server.",
        featureFlag: FEATURE_FLAG,
      },
      423,
    );
  }

  const { data: batch, error: batchError } = await supabaseAdmin
    .from("import_batches")
    .select("id,status,import_type")
    .eq("id", id)
    .maybeSingle();

  if (batchError) return json({ ok: false, error: batchError.message }, 500);
  if (!batch) return json({ ok: false, error: "Import batch not found" }, 404);
  if (batch.import_type !== "bgmi_tournament_results") {
    return json({ ok: false, error: "This is not a BGMI results batch" }, 409);
  }
  if (batch.status !== "validated" && batch.status !== "imported") {
    return json(
      {
        ok: false,
        error: "Resolve every invalid or unresolved row before promotion.",
      },
      409,
    );
  }

  const { data, error } = await supabaseAdmin.rpc("promote_bgmi_import_batch", {
    target_batch_id: id,
  });

  if (error) return json({ ok: false, error: error.message }, 500);

  const result = data as PromotionResult | null;
  if (!result?.ok) {
    return json(
      { ok: false, error: result?.reason || "Promotion was blocked", result },
      409,
    );
  }

  return json({ ok: true, result });
}
