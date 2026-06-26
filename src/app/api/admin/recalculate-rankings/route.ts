import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function POST() {
  const startedAt = new Date().toISOString();

  const { data: job, error: jobError } = await supabaseAdmin
    .from("api_import_jobs")
    .insert({
      provider: "playrank_internal",
      job_type: "recalculate_rankings",
      status: "running",
      started_at: startedAt,
      request_params: {
        action: "calculate_player_scores",
      },
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to create ranking recalculation job",
        details: jobError?.message,
      },
      500
    );
  }

  const { error: scoreError } = await supabaseAdmin.rpc(
    "calculate_player_scores"
  );

  if (scoreError) {
    await supabaseAdmin
      .from("api_import_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        response_summary: {
          ok: false,
          action: "calculate_player_scores",
        },
        error_message: scoreError.message,
      })
      .eq("id", job.id);

    return jsonResponse(
      {
        ok: false,
        job_id: job.id,
        error: "Failed to recalculate player scores",
        details: scoreError.message,
      },
      500
    );
  }

  await supabaseAdmin
    .from("api_import_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      response_summary: {
        ok: true,
        action: "calculate_player_scores",
      },
      error_message: null,
    })
    .eq("id", job.id);

  return jsonResponse({
    ok: true,
    job_id: job.id,
    recalculated: true,
    action: "calculate_player_scores",
  });
}