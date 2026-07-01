import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const JOB_TYPE = "recalculate_rankings";
const PROVIDER = "playrank_internal";
const ACTION = "calculate_player_scores";
const RUNNING_JOB_WINDOW_MINUTES = 30;

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown server error";
}

async function markJobFailed(jobId: string, message: string) {
  await supabaseAdmin
    .from("api_import_jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      response_summary: {
        ok: false,
        action: ACTION,
      },
      error_message: message,
    })
    .eq("id", jobId);
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

export async function GET() {
  return methodNotAllowed();
}
export async function POST() {
  const startedAt = new Date().toISOString();
  const runningSinceCutoff = new Date(
    Date.now() - RUNNING_JOB_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { data: runningJob, error: runningJobError } = await supabaseAdmin
    .from("api_import_jobs")
    .select("id, started_at, status")
    .eq("provider", PROVIDER)
    .eq("job_type", JOB_TYPE)
    .eq("status", "running")
    .gte("started_at", runningSinceCutoff)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runningJobError) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to check active ranking recalculation jobs",
      },
      500
    );
  }

  if (runningJob) {
    return jsonResponse(
      {
        ok: false,
        blocked: true,
        reason: "A ranking recalculation job is already running",
        running_job_id: runningJob.id,
        started_at: runningJob.started_at,
      },
      409
    );
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from("api_import_jobs")
    .insert({
      provider: PROVIDER,
      job_type: JOB_TYPE,
      status: "running",
      started_at: startedAt,
      request_params: {
        action: ACTION,
      },
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to create ranking recalculation job",
      },
      500
    );
  }

  try {
    const { error: scoreError } = await supabaseAdmin.rpc(ACTION);

    if (scoreError) {
      await markJobFailed(job.id, scoreError.message);

      return jsonResponse(
        {
          ok: false,
          job_id: job.id,
          error: "Failed to recalculate player scores",
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
          action: ACTION,
        },
        error_message: null,
      })
      .eq("id", job.id);

    return jsonResponse({
      ok: true,
      job_id: job.id,
      recalculated: true,
      action: ACTION,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    await markJobFailed(job.id, message);

    return jsonResponse(
      {
        ok: false,
        job_id: job.id,
        error: "Unexpected ranking recalculation failure",
      },
      500
    );
  }
}

