import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function aliasSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\(indian team\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: batchId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    sourceTeamName?: string;
    teamId?: string;
  } | null;

  const sourceTeamName = body?.sourceTeamName?.trim() || "";
  const teamId = body?.teamId?.trim() || "";

  if (!UUID.test(batchId) || !UUID.test(teamId) || !sourceTeamName) {
    return NextResponse.json(
      { ok: false, error: "Invalid resolution request" },
      { status: 400 },
    );
  }

  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id,name")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return NextResponse.json(
      { ok: false, error: "PlayRank team not found" },
      { status: 404 },
    );
  }

  const { error: aliasError } = await supabaseAdmin
    .from("bgmi_team_aliases")
    .upsert(
      {
        team_id: teamId,
        alias: sourceTeamName,
        alias_slug: aliasSlug(sourceTeamName),
        source: "liquipedia",
        verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "alias_slug" },
    );

  if (aliasError) {
    return NextResponse.json(
      { ok: false, error: aliasError.message },
      { status: 409 },
    );
  }

  const { data: affected, error: affectedError } = await supabaseAdmin
    .from("bgmi_import_rows")
    .select("id,validation_errors")
    .eq("import_batch_id", batchId)
    .eq("team_name", sourceTeamName)
    .eq("status", "unresolved");

  if (affectedError) {
    return NextResponse.json(
      { ok: false, error: affectedError.message },
      { status: 500 },
    );
  }

  for (const row of affected || []) {
    const errors = Array.isArray(row.validation_errors)
      ? row.validation_errors.filter(
          (error): error is string =>
            typeof error === "string" && !error.startsWith("Unmapped team:"),
        )
      : [];

    const { error } = await supabaseAdmin
      .from("bgmi_import_rows")
      .update({
        team_id: teamId,
        status: errors.length ? "unresolved" : "matched",
        validation_errors: errors,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }
  }

  const { data: rows } = await supabaseAdmin
    .from("bgmi_import_rows")
    .select("status")
    .eq("import_batch_id", batchId);

  const summary = (rows || []).reduce(
    (counts, row) => {
      if (row.status in counts) counts[row.status as keyof typeof counts] += 1;
      return counts;
    },
    { matched: 0, unresolved: 0, invalid: 0, imported: 0, pending: 0 },
  );

  const status =
    summary.unresolved || summary.invalid ? "needs_review" : "validated";

  await supabaseAdmin
    .from("import_batches")
    .update({
      status,
      processed_records: summary.matched + summary.imported,
      failed_records: summary.invalid,
    })
    .eq("id", batchId);

  return NextResponse.json({
    ok: true,
    resolved_rows: affected?.length || 0,
    source_team_name: sourceTeamName,
    matched_team: team,
    batch_status: status,
    summary,
  });
}
