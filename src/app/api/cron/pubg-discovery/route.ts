import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type WatchlistRow = {
  id: string;
  pubg_account_id: string;
  shard: string;
};

type PubgPlayerPayload = {
  data?: {
    relationships?: {
      matches?: {
        data?: Array<{ id?: string }>;
      };
    };
  };
};

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hasValidCronSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!expected || !provided || expected.length !== provided.length)
    return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ provided.charCodeAt(index);
  }

  return mismatch === 0;
}

function matchIds(payload: PubgPlayerPayload) {
  const matches = payload.data?.relationships?.matches?.data;
  if (!Array.isArray(matches)) return [];

  return matches
    .map((match) => match.id?.trim())
    .filter((id): id is string => Boolean(id))
    .slice(0, 20);
}

async function markWatchlistResult(id: string, error: string | null) {
  await supabaseAdmin
    .from("pubg_player_watchlist")
    .update({
      last_checked_at: new Date().toISOString(),
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function GET() {
  return reply({ ok: false, error: "Method not allowed" }, 405);
}

export async function POST(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return reply({ ok: false, error: "Unauthorized" }, 401);
  }

  const apiKey = process.env.PUBG_API_KEY;
  if (!apiKey) {
    return reply({ ok: false, error: "PUBG API is not configured" }, 500);
  }

  const startedAt = new Date().toISOString();
  const { data: job, error: jobError } = await supabaseAdmin
    .from("api_import_jobs")
    .insert({
      provider: "pubg_developer_api",
      job_type: "discover_matches",
      status: "running",
      started_at: startedAt,
      request_params: { source: "verified_player_watchlist" },
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return reply({ ok: false, error: "Failed to create discovery job" }, 500);
  }

  const { data, error } = await supabaseAdmin
    .from("pubg_player_watchlist")
    .select("id, pubg_account_id, shard")
    .eq("active", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) {
    await supabaseAdmin
      .from("api_import_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq("id", job.id);

    return reply({ ok: false, job_id: job.id, error: error.message }, 500);
  }

  const watchlist = (data || []) as WatchlistRow[];
  let discovered = 0;
  let failedAccounts = 0;

  for (const account of watchlist) {
    try {
      const endpoint = `/shards/${account.shard}/players/${encodeURIComponent(account.pubg_account_id)}`;
      const response = await fetch(`https://api.pubg.com${endpoint}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        const message = `PUBG player lookup failed with status ${response.status}`;
        await markWatchlistResult(account.id, message);
        failedAccounts += 1;
        continue;
      }

      const payload = (await response.json()) as PubgPlayerPayload;
      const ids = matchIds(payload);

      if (ids.length > 0) {
        const rows = ids.map((externalMatchId) => ({
          external_match_id: externalMatchId,
          shard: account.shard,
          source_account_id: account.pubg_account_id,
          status: "discovered",
        }));

        const { error: queueError } = await supabaseAdmin
          .from("pubg_match_discovery_queue")
          .upsert(rows, {
            onConflict: "shard,external_match_id",
            ignoreDuplicates: true,
          });

        if (queueError) throw queueError;
        discovered += ids.length;
      }

      await markWatchlistResult(account.id, null);
    } catch (accountError) {
      const message =
        accountError instanceof Error
          ? accountError.message
          : "Unknown discovery error";
      await markWatchlistResult(account.id, message);
      failedAccounts += 1;
    }
  }

  await supabaseAdmin
    .from("api_import_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      response_summary: {
        ok: true,
        accounts_checked: watchlist.length,
        matches_seen: discovered,
        failed_accounts: failedAccounts,
      },
      error_message: null,
    })
    .eq("id", job.id);

  return reply({
    ok: true,
    job_id: job.id,
    accounts_checked: watchlist.length,
    matches_seen: discovered,
    failed_accounts: failedAccounts,
  });
}
