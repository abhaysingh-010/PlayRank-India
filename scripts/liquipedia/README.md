# Liquipedia BGMI history downloader

This downloader discovers BGMI tournament pages through Liquipedia's MediaWiki API,
caches every API response, and records the source page and revision identifiers needed
for an auditable PlayRank import.

## Run on Windows PowerShell

```powershell
$env:LIQUIPEDIA_CONTACT = "https://github.com/abhaysingh-010/PlayRank-India"

node .\scripts\liquipedia\download-bgmi-history.mjs `
  --years 2021,2022,2023,2024,2025
```

If `liquipedia-bgmi.json` has already been downloaded with `action=parse&prop=links`,
reuse it and avoid another parse request:

```powershell
node .\scripts\liquipedia\download-bgmi-history.mjs `
  --years 2021,2022,2023,2024,2025 `
  --index-file .\liquipedia-bgmi.json
```

Output is written to `data/liquipedia/bgmi-history` and contains:

- `manifest.json`: every discovered tournament page and revision
- `manifest-YYYY.json`: year-specific import inventory
- `pages/*.json`: cached wikitext with source metadata
- `raw-cache/*.json`: reusable API responses

Do not commit `raw-cache` or downloaded page payloads unless the repository deliberately
versions source snapshots. PlayRank must attribute Liquipedia wherever this data is shown.

The downloader follows Liquipedia's MediaWiki API requirements: a custom User-Agent,
compressed responses, cached results, and request throttling.

## Extract match results

After downloading the source pages, create normalized match-result files:

```powershell
node .\scripts\liquipedia\extract-bgmi-match-results.mjs `
  --years 2021,2022,2023,2024,2025
```

The extractor emits all discovered rows separately from `import_ready_team_results.csv`.
Only maps with exactly 16 teams, one unique placement from 1 through 16, a valid date,
and a date inside the explicitly allowed years enter the import-ready file. Incomplete,
undated, and out-of-scope tables remain in the quality report and cannot accidentally
affect rankings.
