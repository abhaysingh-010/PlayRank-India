import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const ALLOWED_SHARDS = new Set(["steam", "kakao", "xbox", "psn"]);
const MATCH_ID_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;

type ImportInput = {
  shard: string;
  matchId: string;
};

type PubgApiPayload = {
  data?: {
    type?: string;
    attributes?: {
      gameMode?: string;
      mapName?: string;
    };
  };
  included?: unknown[];
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
    405,
  );
}

function getPayloadMeta(payload: unknown) {
  const payloadObject = payload as PubgApiPayload | null;

  return {
    matchType: payloadObject?.data?.type ?? null,
    gameMode: payloadObject?.data?.attributes?.gameMode ?? null,
    mapName: payloadObject?.data?.attributes?.mapName ?? null,
    includedCount: Array.isArray(payloadObject?.included)
      ? payloadObject.included.length
      : 0,
  };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      non_json_response: true,
      preview: text.slice(0, 500),
    };
  }
}

function validateInput(input: ImportInput) {
  const shard = input.shard.trim().toLowerCase();
  const matchId = input.matchId.trim();

  if (!ALLOWED_SHARDS.has(shard)) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Invalid shard",
        allowed_shards: Array.from(ALLOWED_SHARDS),
      },
    };
  }

  if (!matchId) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Missing matchId",
      },
    };
  }

  if (!MATCH_ID_PATTERN.test(matchId)) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        ok: false,
        error: "Invalid matchId format",
      },
    };
  }

  return {
    ok: true as const,
    shard,
    matchId,
  };
}

async function markJobFailed({
  jobId,
  endpoint,
  shard,
  matchId,
  errorMessage,
  responseSummary,
}: {
  jobId: string;
  endpoint: string;
  shard: string;
  matchId: string;
  errorMessage: string;
  responseSummary?: Record<string, unknown>;
}) {
  await supabaseAdmin
    .from("api_import_jobs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      response_summary: {
        ok: false,
        endpoint,
        shard,
        matchId,
        ...(responseSummary || {}),
      },
      error_message: errorMessage,
    })
    .eq("id", jobId);
}

async function importPubgMatch(input: ImportInput) {
  const startedAt = new Date().toISOString();
  const validated = validateInput(input);

  if (!validated.ok) {
    return jsonResponse(validated.payload, validated.status);
  }

  const { shard, matchId } = validated;
  const apiKey = process.env.PUBG_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      {
        ok: false,
        error: "PUBG API is not configured",
      },
      500,
    );
  }

  const endpoint = `/shards/${shard}/matches/${matchId}`;
  const url = `https://api.pubg.com${endpoint}`;
  const rawExternalId = `pubg-match-${shard}-${matchId}`;

  const { data: job, error: jobError } = await supabaseAdmin
    .from("api_import_jobs")
    .insert({
      provider: "pubg_developer_api",
      job_type: "import_match",
      status: "running",
      started_at: startedAt,
      request_params: {
        shard,
        matchId,
        endpoint,
      },
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to create API import job",
      },
      500,
    );
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      await markJobFailed({
        jobId: job.id,
        endpoint,
        shard,
        matchId,
        errorMessage: `PUBG API request failed with status ${response.status}`,
        responseSummary: {
          http_status: response.status,
          payload,
        },
      });

      return jsonResponse(
        {
          ok: false,
          job_id: job.id,
          error: "PUBG API request failed",
          http_status: response.status,
        },
        502,
      );
    }

    const { matchType, gameMode, mapName, includedCount } =
      getPayloadMeta(payload);

    const { data: rawImport, error: rawImportError } = await supabaseAdmin
      .from("raw_esports_imports")
      .upsert(
        {
          source: "pubg_developer_api",
          source_url: url,
          source_type: "api_match",
          external_id: rawExternalId,
          payload,
          processed: false,
          notes: `Imported PUBG API match ${matchId} from shard ${shard}`,
        },
        {
          onConflict: "source,source_type,external_id",
        },
      )
      .select("id")
      .single();

    if (rawImportError || !rawImport) {
      await markJobFailed({
        jobId: job.id,
        endpoint,
        shard,
        matchId,
        errorMessage: rawImportError?.message || "Failed to upsert raw import",
        responseSummary: {
          http_status: response.status,
        },
      });

      return jsonResponse(
        {
          ok: false,
          job_id: job.id,
          error: "Failed to store raw import",
        },
        500,
      );
    }

    const { error: normalizeError } = await supabaseAdmin.rpc(
      "normalize_pubg_api_match",
      {
        raw_external_id: rawExternalId,
      },
    );

    if (normalizeError) {
      await markJobFailed({
        jobId: job.id,
        endpoint,
        shard,
        matchId,
        errorMessage: normalizeError.message,
        responseSummary: {
          normalized: false,
          http_status: response.status,
          raw_import_id: rawImport.id,
        },
      });

      return jsonResponse(
        {
          ok: false,
          job_id: job.id,
          raw_import_id: rawImport.id,
          error: "Raw import succeeded, but normalization failed",
        },
        500,
      );
    }

    const { data: overview, error: overviewError } = await supabaseAdmin
      .from("pubg_api_match_overview")
      .select("*")
      .eq("external_match_id", matchId)
      .single();

    if (overviewError) {
      await markJobFailed({
        jobId: job.id,
        endpoint,
        shard,
        matchId,
        errorMessage: overviewError.message,
        responseSummary: {
          normalized: true,
          http_status: response.status,
          raw_import_id: rawImport.id,
        },
      });

      return jsonResponse(
        {
          ok: false,
          normalized: true,
          job_id: job.id,
          raw_import_id: rawImport.id,
          error: "Normalization succeeded, but overview fetch failed",
        },
        500,
      );
    }

    await supabaseAdmin
      .from("api_import_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        raw_import_count: 1,
        normalized_match_count: 1,
        response_summary: {
          ok: true,
          normalized: true,
          http_status: response.status,
          endpoint,
          shard,
          matchId,
          raw_import_id: rawImport.id,
          matchType,
          gameMode,
          mapName,
          includedCount,
          overview,
        },
        error_message: null,
      })
      .eq("id", job.id);

    return jsonResponse({
      ok: true,
      normalized: true,
      job_id: job.id,
      raw_import_id: rawImport.id,
      http_status: response.status,
      shard,
      matchId,
      matchType,
      gameMode,
      mapName,
      includedCount,
      overview,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown import failure";

    await markJobFailed({
      jobId: job.id,
      endpoint,
      shard,
      matchId,
      errorMessage: message,
    });

    return jsonResponse(
      {
        ok: false,
        job_id: job.id,
        error: "Unexpected PUBG import failure",
      },
      500,
    );
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<ImportInput> | null;

  return importPubgMatch({
    shard: body?.shard || "steam",
    matchId: body?.matchId || "",
  });
}
