import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type CsvRow = Record<string, string>;
type Team = { id: string; name: string; short_name: string | null; slug: string };
type Player = { id: string; ign: string; slug: string };
type Alias = { team_id: string; alias_slug: string };
type PlayerAlias = { player_id: string | null; alias_slug: string };

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 10_000;

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseCsv(input: string): CsvRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      record.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      record.push(field.trim());
      field = "";
      if (record.some(Boolean)) records.push(record);
      record = [];
    } else {
      field += char;
    }
  }

  record.push(field.trim());
  if (record.some(Boolean)) records.push(record);
  if (records.length < 2) return [];

  const headers = records[0].map((header) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );

  return records.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function value(row: CsvRow, ...keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function integer(input: string) {
  if (!input.trim()) return null;
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateValue(input: string) {
  if (!input.trim()) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const tournamentName = String(form.get("tournamentName") ?? "").trim();
  const sourceUrl = String(form.get("sourceUrl") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "CSV or JSON file is required" }, { status: 400 });
  }
  if (!tournamentName) {
    return NextResponse.json({ ok: false, error: "Tournament name is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "File exceeds the 5 MB limit" }, { status: 413 });
  }

  const text = await file.text();
  let rows: CsvRow[];

  try {
    if (file.name.toLowerCase().endsWith(".json")) {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
      rows = parsed.map((item) => item as CsvRow);
    } else {
      rows = parseCsv(text);
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid file" },
      { status: 400 }
    );
  }

  if (!rows.length || rows.length > MAX_ROWS) {
    return NextResponse.json(
      { ok: false, error: rows.length ? "Maximum 10,000 rows per import" : "No data rows found" },
      { status: 400 }
    );
  }

  const [{ data: teams }, { data: players }, { data: teamAliases }, { data: playerAliases }] =
    await Promise.all([
      supabaseAdmin.from("teams").select("id,name,short_name,slug"),
      supabaseAdmin.from("players").select("id,ign,slug"),
      supabaseAdmin.from("bgmi_team_aliases").select("team_id,alias_slug").eq("verified", true),
      supabaseAdmin.from("player_aliases").select("player_id,alias_slug").eq("verified", true),
    ]);

  const teamMap = new Map<string, string>();
  for (const team of (teams ?? []) as Team[]) {
    [team.name, team.short_name, team.slug].filter(Boolean).forEach((key) => teamMap.set(normalize(key), team.id));
  }
  for (const alias of (teamAliases ?? []) as Alias[]) teamMap.set(normalize(alias.alias_slug), alias.team_id);

  const playerMap = new Map<string, string>();
  for (const player of (players ?? []) as Player[]) {
    [player.ign, player.slug].forEach((key) => playerMap.set(normalize(key), player.id));
  }
  for (const alias of (playerAliases ?? []) as PlayerAlias[]) {
    if (alias.player_id) playerMap.set(normalize(alias.alias_slug), alias.player_id);
  }

  const batchId = crypto.randomUUID();
  const batchSlug = `bgmi-${slug(tournamentName)}-${Date.now()}`;
  const prepared = rows.map((row, index) => {
    const teamName = value(row, "team_name", "team");
    const playerIgn = value(row, "player_ign", "player", "ign");
    const externalMatchId = value(row, "external_match_id", "match_id");
    const recordType = playerIgn ? "player_stat" : "team_result";
    const teamId = teamMap.get(normalize(teamName)) ?? null;
    const playerId = playerIgn ? playerMap.get(normalize(playerIgn)) ?? null : null;
    const errors: string[] = [];

    if (!externalMatchId) errors.push("Missing match_id");
    if (!teamName) errors.push("Missing team_name");
    if (teamName && !teamId) errors.push(`Unmapped team: ${teamName}`);
    if (recordType === "player_stat" && !playerId) errors.push(`Unmapped player: ${playerIgn}`);

    const invalid = errors.some((error) => error.startsWith("Missing"));
    const status = invalid ? "invalid" : errors.length ? "unresolved" : "matched";

    return {
      import_batch_id: batchId,
      row_number: index + 1,
      record_type: recordType,
      external_match_id: externalMatchId || `invalid-row-${index + 1}`,
      match_number: integer(value(row, "match_number", "match_no")),
      match_date: dateValue(value(row, "match_date", "date")),
      tournament_name: value(row, "tournament_name") || tournamentName,
      stage: value(row, "stage"),
      map_name: value(row, "map_name", "map"),
      team_name: teamName || "Unknown",
      team_id: teamId,
      player_ign: playerIgn || null,
      player_id: playerId,
      placement: integer(value(row, "placement", "rank")),
      kills: integer(value(row, "kills")),
      damage: integer(value(row, "damage")),
      assists: integer(value(row, "assists")),
      knocks: integer(value(row, "knocks")),
      revives: integer(value(row, "revives")),
      survival_time: integer(value(row, "survival_time")),
      placement_points: integer(value(row, "placement_points")),
      kill_points: integer(value(row, "kill_points")),
      total_points: integer(value(row, "total_points", "points")),
      raw_payload: row,
      status,
      validation_errors: errors,
    };
  });

  const counts = prepared.reduce(
    (summary, row) => {
      summary[row.status as keyof typeof summary] += 1;
      return summary;
    },
    { matched: 0, unresolved: 0, invalid: 0 }
  );
  const batchStatus = counts.invalid || counts.unresolved ? "needs_review" : "validated";

  const { error: batchError } = await supabaseAdmin.from("import_batches").insert({
    id: batchId,
    batch_name: `${tournamentName} — ${file.name}`,
    batch_slug: batchSlug,
    import_type: "bgmi_tournament_results",
    status: batchStatus,
    source_url: sourceUrl || null,
    notes: `Organizer file: ${file.name}`,
    total_records: prepared.length,
    processed_records: counts.matched,
    failed_records: counts.invalid,
    started_at: new Date().toISOString(),
  });

  if (batchError) {
    return NextResponse.json({ ok: false, error: batchError.message }, { status: 500 });
  }

  const { error: rawError } = await supabaseAdmin.from("raw_esports_imports").insert({
    source: "bgmi_organizer_file",
    source_url: sourceUrl || null,
    source_type: file.name.toLowerCase().endsWith(".json") ? "json_batch" : "csv_batch",
    external_id: batchSlug,
    payload: rows,
    processed: false,
    import_batch_id: batchId,
    notes: `Original organizer import: ${file.name}`,
  });

  let rowsError: { message: string } | null = null;
  for (let offset = 0; offset < prepared.length; offset += 500) {
    const { error } = await supabaseAdmin
      .from("bgmi_import_rows")
      .insert(prepared.slice(offset, offset + 500));
    if (error) {
      rowsError = error;
      break;
    }
  }

  if (rawError || rowsError) {
    await supabaseAdmin
      .from("import_batches")
      .update({ status: "failed", failed_records: prepared.length, completed_at: new Date().toISOString() })
      .eq("id", batchId);

    return NextResponse.json(
      { ok: false, batch_id: batchId, error: rawError?.message || rowsError?.message },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("import_batches")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", batchId);

  return NextResponse.json({
    ok: true,
    batch_id: batchId,
  });
}
