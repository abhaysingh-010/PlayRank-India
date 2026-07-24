#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API_URL = "https://liquipedia.net/pubgmobile/api.php";
const INDEX_PAGE = "Battlegrounds_Mobile_India";
const REQUEST_INTERVAL_MS = 2_100;
const PARSE_INTERVAL_MS = 30_100;
const BATCH_SIZE = 40;

function parseArguments(argv) {
  const options = {
    years: [2021, 2022, 2023, 2024, 2025],
    output: "data/liquipedia/bgmi-history",
    indexFile: null,
    refresh: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--years") {
      options.years = argv[++index]
        .split(",")
        .map((year) => Number.parseInt(year.trim(), 10))
        .filter(Number.isInteger);
    } else if (argument === "--output") {
      options.output = argv[++index];
    } else if (argument === "--index-file") {
      options.indexFile = argv[++index];
    } else if (argument === "--refresh") {
      options.refresh = true;
    } else if (argument === "--help") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.years.length) throw new Error("At least one year is required");
  return options;
}

function printHelp() {
  console.log(`Download and cache BGMI tournament source pages from Liquipedia.

Usage:
  node scripts/liquipedia/download-bgmi-history.mjs [options]

Options:
  --years 2021,2022     Years to discover (default: 2021-2025)
  --output PATH         Output directory
  --index-file PATH     Reuse an existing action=parse index response
  --refresh             Ignore cached API responses
  --help                Show this message

Environment:
  LIQUIPEDIA_CONTACT    Contact URL or email included in the User-Agent
`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function safeFileName(value) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function revisionContent(page) {
  const revision = page.revisions?.[0];
  return revision?.slots?.main?.content ?? revision?.slots?.main?.["*"] ?? revision?.["*"] ?? "";
}

function extractYears(title, content) {
  const years = new Set();
  const candidates = [
    ...title.matchAll(/(?:^|\/|\s)(20\d{2})(?:$|\/|\s)/g),
    ...content.matchAll(/^\s*\|\s*(?:sdate|edate|date)\s*=\s*(20\d{2})/gim),
  ];
  for (const match of candidates) years.add(Number.parseInt(match[1], 10));
  return [...years].sort();
}

function isBgmiTournament(content) {
  return /\{\{\s*Infobox\s+league\b/i.test(content) &&
    /^\s*\|\s*game\s*=\s*(?:bgmi|Battlegrounds Mobile India)\s*$/im.test(content);
}

class LiquipediaClient {
  constructor({ userAgent, cacheDirectory, refresh }) {
    this.userAgent = userAgent;
    this.cacheDirectory = cacheDirectory;
    this.refresh = refresh;
    this.lastRequestAt = 0;
  }

  async request(parameters, { parse = false, cacheName } = {}) {
    const query = new URLSearchParams({ format: "json", formatversion: "2", ...parameters });
    const cacheKey = cacheName ?? createHash("sha256").update(query.toString()).digest("hex");
    const cachePath = path.join(this.cacheDirectory, `${safeFileName(cacheKey)}.json`);

    if (!this.refresh && existsSync(cachePath)) {
      return JSON.parse(await readFile(cachePath, "utf8"));
    }

    const interval = parse ? PARSE_INTERVAL_MS : REQUEST_INTERVAL_MS;
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < interval) await sleep(interval - elapsed);

    const response = await fetch(`${API_URL}?${query}`, {
      headers: {
        "User-Agent": this.userAgent,
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
    this.lastRequestAt = Date.now();

    if (!response.ok) {
      throw new Error(`Liquipedia API ${response.status}: ${await response.text()}`);
    }

    const payload = await response.json();
    if (payload.error) throw new Error(`Liquipedia API: ${payload.error.info ?? payload.error.code}`);
    await writeFile(cachePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return payload;
  }
}

async function loadIndex(options, client) {
  if (options.indexFile) {
    return JSON.parse(await readFile(options.indexFile, "utf8"));
  }

  return client.request(
    { action: "parse", page: INDEX_PAGE, prop: "links" },
    { parse: true, cacheName: "bgmi-index-links" },
  );
}

function indexTitles(payload) {
  const links = payload.parse?.links;
  if (!Array.isArray(links)) throw new Error("Index response does not contain parse.links");
  return [...new Set(
    links
      .filter((link) => (link.ns ?? 0) === 0)
      .map((link) => link.title ?? link["*"])
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right));
}

async function downloadPages(titles, client) {
  const pages = [];
  const titleBatches = chunks(titles, BATCH_SIZE);

  for (let index = 0; index < titleBatches.length; index += 1) {
    const batch = titleBatches[index];
    console.log(`Fetching source batch ${index + 1}/${titleBatches.length} (${batch.length} pages)`);
    const payload = await client.request(
      {
        action: "query",
        prop: "revisions",
        rvprop: "ids|timestamp|content",
        rvslots: "main",
        redirects: "1",
        titles: batch.join("|"),
      },
      { cacheName: `source-batch-${String(index + 1).padStart(3, "0")}` },
    );
    pages.push(...(payload.query?.pages ?? []));
  }

  return pages;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) return printHelp();

  const contact = process.env.LIQUIPEDIA_CONTACT ||
    "https://github.com/abhaysingh-010/PlayRank-India";
  const outputDirectory = path.resolve(options.output);
  const cacheDirectory = path.join(outputDirectory, "raw-cache");
  const pageDirectory = path.join(outputDirectory, "pages");
  await mkdir(cacheDirectory, { recursive: true });
  await mkdir(pageDirectory, { recursive: true });

  const client = new LiquipediaClient({
    userAgent: `PlayRankIndia/1.0 (${contact})`,
    cacheDirectory,
    refresh: options.refresh,
  });

  const index = await loadIndex(options, client);
  const titles = indexTitles(index);
  console.log(`Discovered ${titles.length} linked main-namespace pages.`);

  const downloadedPages = await downloadPages(titles, client);
  const requestedYears = new Set(options.years);
  const manifest = [];

  for (const page of downloadedPages) {
    if (page.missing || !page.pageid) continue;
    const content = revisionContent(page);
    if (!isBgmiTournament(content)) continue;
    const years = extractYears(page.title, content);
    if (!years.some((year) => requestedYears.has(year))) continue;

    const revision = page.revisions?.[0] ?? {};
    const sourceUrl = `https://liquipedia.net/pubgmobile/${page.title.replaceAll(" ", "_")}`;
    const pageRecord = {
      title: page.title,
      page_id: page.pageid,
      revision_id: revision.revid ?? null,
      revision_parent_id: revision.parentid ?? null,
      revision_timestamp: revision.timestamp ?? null,
      years,
      source_url: sourceUrl,
      retrieved_at: new Date().toISOString(),
      wikitext: content,
    };

    await writeFile(
      path.join(pageDirectory, `${page.pageid}-${safeFileName(page.title)}.json`),
      `${JSON.stringify(pageRecord, null, 2)}\n`,
      "utf8",
    );
    manifest.push({ ...pageRecord, wikitext: undefined });
  }

  manifest.sort((left, right) => left.title.localeCompare(right.title));
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify({ index_page: INDEX_PAGE, requested_years: options.years, pages: manifest }, null, 2)}\n`,
    "utf8",
  );

  for (const year of options.years) {
    const yearPages = manifest.filter((page) => page.years.includes(year));
    await writeFile(
      path.join(outputDirectory, `manifest-${year}.json`),
      `${JSON.stringify({ year, pages: yearPages }, null, 2)}\n`,
      "utf8",
    );
    console.log(`${year}: ${yearPages.length} tournament source pages`);
  }

  console.log(`Saved ${manifest.length} audited tournament pages to ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
