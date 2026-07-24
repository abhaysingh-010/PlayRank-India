#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArguments(argv) {
  const options = {
    input: "data/liquipedia/bgmi-history",
    output: "data/liquipedia/bgmi-history/extracted",
    years: [2021, 2022, 2023, 2024, 2025],
  };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--input") options.input = argv[++index];
    else if (argv[index] === "--output") options.output = argv[++index];
    else if (argv[index] === "--years") {
      options.years = argv[++index]
        .split(",")
        .map((year) => Number.parseInt(year.trim(), 10))
        .filter(Number.isInteger);
    }
    else if (argv[index] === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

function printHelp() {
  console.log(`Extract normalized BGMI team match results from cached Liquipedia pages.

Usage:
  node scripts/liquipedia/extract-bgmi-match-results.mjs [options]

Options:
  --input PATH    Downloader output directory
  --output PATH   CSV and quality-report directory
  --years LIST    Allowed match years (default: 2021-2025)
  --help          Show this message
`);
}

function templateName(text, start) {
  const end = text.slice(start + 2).search(/[|}\n]/);
  if (end < 0) return "";
  return text.slice(start + 2, start + 2 + end).trim().toLowerCase();
}

function extractTemplates(text, wantedName) {
  const templates = [];
  const stack = [];
  for (let index = 0; index < text.length - 1; index += 1) {
    const pair = text.slice(index, index + 2);
    if (pair === "{{") {
      stack.push({ start: index, name: templateName(text, index) });
      index += 1;
    } else if (pair === "}}" && stack.length) {
      const opened = stack.pop();
      if (opened.name === wantedName.toLowerCase()) {
        templates.push({ start: opened.start, text: text.slice(opened.start, index + 2) });
      }
      index += 1;
    }
  }
  return templates.sort((left, right) => left.start - right.start);
}

function splitTopLevel(text, separator) {
  const parts = [];
  let start = 0;
  let templateDepth = 0;
  let linkDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const pair = text.slice(index, index + 2);
    if (pair === "{{") {
      templateDepth += 1;
      index += 1;
    } else if (pair === "}}") {
      templateDepth = Math.max(0, templateDepth - 1);
      index += 1;
    } else if (pair === "[[") {
      linkDepth += 1;
      index += 1;
    } else if (pair === "]]" ) {
      linkDepth = Math.max(0, linkDepth - 1);
      index += 1;
    } else if (text[index] === separator && templateDepth === 0 && linkDepth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function firstTopLevelEquals(text) {
  let templateDepth = 0;
  let linkDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const pair = text.slice(index, index + 2);
    if (pair === "{{") { templateDepth += 1; index += 1; }
    else if (pair === "}}") { templateDepth = Math.max(0, templateDepth - 1); index += 1; }
    else if (pair === "[[") { linkDepth += 1; index += 1; }
    else if (pair === "]]" ) { linkDepth = Math.max(0, linkDepth - 1); index += 1; }
    else if (text[index] === "=" && templateDepth === 0 && linkDepth === 0) return index;
  }
  return -1;
}

function parseTemplate(text) {
  const inner = text.startsWith("{{") && text.endsWith("}}") ? text.slice(2, -2) : text;
  const pieces = splitTopLevel(inner, "|");
  const positional = [];
  const named = {};
  for (const piece of pieces.slice(1)) {
    const equals = firstTopLevelEquals(piece);
    if (equals < 0) positional.push(piece.trim());
    else named[piece.slice(0, equals).trim().toLowerCase()] = piece.slice(equals + 1).trim();
  }
  return { name: pieces[0]?.trim() ?? "", positional, named };
}

function nestedTemplate(value, name) {
  return extractTemplates(value ?? "", name)[0]?.text ?? null;
}

function stripWiki(value) {
  return String(value ?? "")
    .replace(/\{\{\s*!\s*}}/g, "|")
    .replace(/\[\[([^\]|]+)\|([^\]]+)]]/g, "$2")
    .replace(/\[\[([^\]]+)]]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)]/g, "$1")
    .replace(/\{\{[^{}]*}}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function number(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapDate(value) {
  const clean = stripWiki(value)
    .replace(/\bFebraury\b/gi, "February")
    .replace(/\bSept\b/gi, "September")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  const iso = clean.match(
    /\b(20\d{2})-(\d{1,2})-(\d{1,2})(?:\s*(?:-|T)?\s*(\d{1,2}):(\d{2}))?/,
  );
  if (iso) {
    return istTimestamp(
      Number.parseInt(iso[1], 10),
      Number.parseInt(iso[2], 10),
      Number.parseInt(iso[3], 10),
      Number.parseInt(iso[4] ?? "0", 10),
      Number.parseInt(iso[5] ?? "0", 10),
    );
  }

  const english = clean.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s*,\s*(20\d{2})(?:\s*-?\s*(\d{1,2}):(\d{2}))?/i,
  );
  if (!english) return null;

  const month = monthNumber(english[1]);
  if (!month) return null;
  return istTimestamp(
    Number.parseInt(english[3], 10),
    month,
    Number.parseInt(english[2], 10),
    Number.parseInt(english[4] ?? "0", 10),
    Number.parseInt(english[5] ?? "0", 10),
  );
}

function monthNumber(value) {
  const key = value.slice(0, 3).toLowerCase();
  return {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }[key];
}

function istTimestamp(year, month, day, hour, minute) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 24 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  // Liquipedia occasionally records late broadcasts as 24:xx. Treat those as
  // the following calendar day instead of rejecting an otherwise valid map.
  const rollover = hour === 24;
  const instant = new Date(Date.UTC(year, month - 1, day + (rollover ? 1 : 0)));
  const expected = new Date(Date.UTC(year, month - 1, day));
  if (
    expected.getUTCFullYear() !== year ||
    expected.getUTCMonth() !== month - 1 ||
    expected.getUTCDate() !== day
  ) {
    return null;
  }

  const yyyy = instant.getUTCFullYear();
  const mm = String(instant.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(instant.getUTCDate()).padStart(2, "0");
  const hh = String(rollover ? 0 : hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+05:30`;
}

function placementPoints(placement, modernScoring) {
  if (!placement) return 0;
  const modern = [10, 6, 5, 4, 3, 2, 1, 1];
  const legacy = [15, 12, 10, 8, 6, 4, 2, 1];
  return (modernScoring ? modern : legacy)[placement - 1] ?? 0;
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\n")}\n`;
}

function tournamentName(page) {
  const infobox = extractTemplates(page.wikitext, "infobox league")[0]?.text;
  if (!infobox) return page.title;
  return stripWiki(parseTemplate(infobox).named.name) || page.title;
}

function extractPage(page, allowedYears) {
  const matches = extractTemplates(page.wikitext, "match");
  const modernScoring = /\{\{\s*(?:PUBGM\s+2023\s+Points\s+System|Points10)\b/i.test(page.wikitext) ||
    page.years.some((year) => year >= 2023);
  const rows = [];
  const matchReports = [];
  let pageMatchNumber = 0;

  matches.forEach((matchTemplate, matchIndex) => {
    const match = parseTemplate(matchTemplate.text);
    const mapEntries = Object.entries(match.named)
      .map(([key, value]) => ({ key, value, number: Number.parseInt(key.match(/^map(\d+)$/)?.[1] ?? "", 10) }))
      .filter((entry) => Number.isInteger(entry.number))
      .sort((left, right) => left.number - right.number);
    const opponents = Object.entries(match.named)
      .map(([key, value]) => ({ key, value, number: Number.parseInt(key.match(/^opponent(\d+)$/)?.[1] ?? "", 10) }))
      .filter((entry) => Number.isInteger(entry.number))
      .map((entry) => {
        const raw = nestedTemplate(entry.value, "teamopponent") ?? nestedTemplate(entry.value, "opponent");
        if (!raw) return null;
        const parsed = parseTemplate(raw);
        return { team: stripWiki(parsed.named.team ?? parsed.positional[0]), results: parsed.named };
      })
      .filter(Boolean);

    for (const mapEntry of mapEntries) {
      pageMatchNumber += 1;
      const mapRaw = nestedTemplate(mapEntry.value, "map");
      const map = mapRaw ? parseTemplate(mapRaw) : { named: {} };
      const externalMatchId = `liquipedia-${page.page_id}-${matchIndex + 1}-${mapEntry.number}`;
      const extractedMatchDate = mapDate(map.named.date);
      const extracted = [];

      for (const opponent of opponents) {
        const scoreRaw = nestedTemplate(opponent.results[`m${mapEntry.number}`], "ms");
        if (!scoreRaw) continue;
        const score = parseTemplate(scoreRaw);
        const placement = number(score.positional[0]);
        const kills = number(score.positional[1]);
        if (!opponent.team || placement === null || kills === null) continue;
        const placementPointValue = placementPoints(placement, modernScoring);
        extracted.push({
          external_match_id: externalMatchId,
          match_number: pageMatchNumber,
          match_date: extractedMatchDate,
          tournament_name: tournamentName(page),
          stage: stripWiki(match.named.title ?? match.named.name ?? match.named.id ?? ""),
          map_name: stripWiki(map.named.map),
          team_name: opponent.team,
          placement,
          kills,
          placement_points: placementPointValue,
          kill_points: kills,
          total_points: placementPointValue + kills,
          source_url: page.source_url,
          source_page_id: page.page_id,
          source_revision_id: page.revision_id,
          source_revision_timestamp: page.revision_timestamp,
          scoring_system: modernScoring ? "pubgm-2023" : "pubgm-legacy",
        });
      }

      const placements = extracted.map((row) => row.placement).sort((a, b) => a - b);
      const structurallyComplete = extracted.length === 16 &&
        placements.every((placement, index) => placement === index + 1);
      const matchYear = extractedMatchDate ? Number.parseInt(extractedMatchDate.slice(0, 4), 10) : null;
      const importReady = structurallyComplete && matchYear !== null && allowedYears.has(matchYear);
      rows.push(...extracted.map((row) => ({ ...row, import_ready: importReady })));
      matchReports.push({
        external_match_id: externalMatchId,
        source_page: page.title,
        source_revision_id: page.revision_id,
        teams: extracted.length,
        dated: Boolean(extracted[0]?.match_date),
        unique_placements: new Set(placements).size,
        match_year: matchYear,
        structurally_complete: structurallyComplete,
        import_ready: importReady,
      });
    }
  });

  return { rows, matchReports, matchTemplates: matches.length };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) return printHelp();
  const input = path.resolve(options.input);
  const output = path.resolve(options.output);
  const allowedYears = new Set(options.years);
  const pageDirectory = path.join(input, "pages");
  await mkdir(output, { recursive: true });

  const files = (await readdir(pageDirectory)).filter((file) => file.endsWith(".json")).sort();
  const allRows = [];
  const allMatches = [];
  const pageReports = [];

  for (const file of files) {
    const page = JSON.parse(await readFile(path.join(pageDirectory, file), "utf8"));
    const extracted = extractPage(page, allowedYears);
    allRows.push(...extracted.rows);
    allMatches.push(...extracted.matchReports);
    pageReports.push({
      title: page.title,
      page_id: page.page_id,
      revision_id: page.revision_id,
      years: page.years,
      match_templates: extracted.matchTemplates,
      maps: extracted.matchReports.length,
      rows: extracted.rows.length,
      complete_maps: extracted.matchReports.filter((match) => match.structurally_complete).length,
      import_ready_maps: extracted.matchReports.filter((match) => match.import_ready).length,
    });
  }

  const columns = [
    "external_match_id", "match_number", "match_date", "tournament_name", "stage", "map_name",
    "team_name", "placement", "kills", "placement_points", "kill_points", "total_points",
    "source_url", "source_page_id", "source_revision_id", "source_revision_timestamp", "scoring_system",
  ];
  const importReady = allRows.filter((row) => row.import_ready);
  await writeFile(path.join(output, "match_team_results.csv"), toCsv(allRows, columns), "utf8");
  await writeFile(path.join(output, "import_ready_team_results.csv"), toCsv(importReady, columns), "utf8");
  await writeFile(path.join(output, "matches.json"), `${JSON.stringify(allMatches, null, 2)}\n`, "utf8");

  const report = {
    generated_at: new Date().toISOString(),
    pages_scanned: pageReports.length,
    pages_with_match_templates: pageReports.filter((page) => page.match_templates > 0).length,
    match_templates: pageReports.reduce((sum, page) => sum + page.match_templates, 0),
    maps_found: allMatches.length,
    allowed_years: options.years,
    complete_maps: allMatches.filter((match) => match.structurally_complete).length,
    import_ready_maps: allMatches.filter((match) => match.import_ready).length,
    incomplete_maps: allMatches.filter((match) => !match.structurally_complete).length,
    undated_maps: allMatches.filter((match) => !match.dated).length,
    extracted_rows: allRows.length,
    import_ready_rows: importReady.length,
    rejected_rows: allRows.length - importReady.length,
    pages: pageReports,
  };
  await writeFile(path.join(output, "quality_report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Pages scanned: ${report.pages_scanned}`);
  console.log(`Pages with match templates: ${report.pages_with_match_templates}`);
  console.log(`Maps found: ${report.maps_found}`);
  console.log(`Complete 16-team maps: ${report.complete_maps}`);
  console.log(`Dated maps inside allowed years: ${report.import_ready_maps}`);
  console.log(`Import-ready rows: ${report.import_ready_rows}`);
  console.log(`Rejected rows: ${report.rejected_rows}`);
  console.log(`Output: ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
