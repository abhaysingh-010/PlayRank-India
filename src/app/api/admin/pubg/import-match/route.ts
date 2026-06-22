import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_SHARDS = new Set(["steam", "kakao", "xbox", "psn"]);

export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString();

  const { searchParams } = new URL(request.url);
  const shard = searchParams.get("shard") || "steam";
  const matchId = searchParams.get("matchId");

  if (!ALLOWED_SHARDS.has(shard)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid shard",
        allowed_shards: Array.from(ALLOWED_SHARDS),
      },
      { status: 400 }
    );
  }

  if (!matchId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing matchId",
        example:
          "/api/admin/pubg/import-match?shard=steam&matchId=f89445ae-489c-4992-add6-9999f644d55e",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.PUBG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing PUBG_API_KEY",
      },
      { status: 500 }
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
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to create API import job",
        details: jobError?.message,
      },
      { status: 500 }
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
    });

    const payload = await response.json();

    if (!response.ok) {
      await supabaseAdmin
        .from("api_import_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          response_summary: {
            ok: false,
            http_status: response.status,
            endpoint,
            shard,
            matchId,
            payload,
          },
          error_message: `PUBG API request failed with status ${response.status}`,
        })
        .eq("id", job.id);

      return NextResponse.json(
        {
          ok: false,
          job_id: job.id,
          http_status: response.status,
          endpoint,
          shard,
          matchId,
          response: payload,
        },
        { status: response.status }
      );
    }

    const payloadObject =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, any>)
        : null;

    const matchType = payloadObject?.data?.type ?? null;
    const gameMode = payloadObject?.data?.attributes?.gameMode ?? null;
    const mapName = payloadObject?.data?.attributes?.mapName ?? null;
    const includedCount = Array.isArray(payloadObject?.included)
      ? payloadObject.included.length
      : 0;

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
        }
      )
      .select("id")
      .single();

    if (rawImportError || !rawImport) {
      await supabaseAdmin
        .from("api_import_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          response_summary: {
            ok: false,
            http_status: response.status,
            endpoint,
            shard,
            matchId,
          },
          error_message: rawImportError?.message || "Failed to upsert raw import",
        })
        .eq("id", job.id);

      return NextResponse.json(
        {
          ok: false,
          job_id: job.id,
          error: "Failed to insert raw import",
          details: rawImportError?.message,
        },
        { status: 500 }
      );
    }

    const { error: normalizeError } = await supabaseAdmin.rpc(
      "normalize_pubg_api_match",
      {
        raw_external_id: rawExternalId,
      }
    );

    if (normalizeError) {
      await supabaseAdmin
        .from("api_import_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          response_summary: {
            ok: false,
            http_status: response.status,
            endpoint,
            shard,
            matchId,
            raw_import_id: rawImport.id,
            normalization_error: normalizeError.message,
          },
          error_message: normalizeError.message,
        })
        .eq("id", job.id);

      return NextResponse.json(
        {
          ok: false,
          job_id: job.id,
          raw_import_id: rawImport.id,
          error: "Raw import succeeded, but normalization failed",
          details: normalizeError.message,
        },
        { status: 500 }
      );
    }

    const { data: overview, error: overviewError } = await supabaseAdmin
      .from("pubg_api_match_overview")
      .select("*")
      .eq("external_match_id", matchId)
      .single();

    if (overviewError) {
      await supabaseAdmin
        .from("api_import_jobs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          response_summary: {
            ok: false,
            normalized: true,
            http_status: response.status,
            endpoint,
            shard,
            matchId,
            raw_import_id: rawImport.id,
            overview_error: overviewError.message,
          },
          error_message: overviewError.message,
        })
        .eq("id", job.id);

      return NextResponse.json(
        {
          ok: false,
          normalized: true,
          job_id: job.id,
          raw_import_id: rawImport.id,
          error: "Normalization succeeded, but overview fetch failed",
          details: overviewError.message,
        },
        { status: 500 }
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

    return NextResponse.json({
      ok: true,
      normalized: true,
      job_id: job.id,
      raw_import_id: rawImport.id,
      http_status: response.status,
      endpoint,
      shard,
      matchId,
      matchType,
      gameMode,
      mapName,
      includedCount,
      overview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

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
        },
        error_message: message,
      })
      .eq("id", job.id);

    return NextResponse.json(
      {
        ok: false,
        job_id: job.id,
        error: message,
      },
      { status: 500 }
    );
  }
} 