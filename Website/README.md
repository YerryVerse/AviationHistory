# Aviation History static portal

This Next.js portal is exported as static files. It has no runtime backend, API routes, serverless functions, Python service, or database server. The browser loads year-partitioned Parquet assets and queries them locally with the bundled DuckDB-Wasm worker.

## Data architecture

- `public/data/manifest.json` is the browser’s validated asset registry.
- `public/data/events/year=YYYY/events.parquet` contains the complete event rows for one year.
- `public/data/summaries/*.parquet` contains compact dashboard and filter aggregates.
- `public/data/schema.json` documents the Arrow schema.
- `public/data/validation.json` records full-publication reconciliation results.
- `public/duckdb/` contains the self-hosted MVP and exception-handling WASM bundles and workers.

React receives only aggregate snapshots or bounded event pages. It never materializes the full dataset in a JavaScript array.

## Prerequisites

- Node.js 20 or newer
- Python 3 with the packages in `../Pendientes/03_Parquet_Dataset/requirements.txt`
- PowerShell 7 on Windows for the checked project launchers

All generated JSON, reports, source code, and other text artifacts use UTF-8. HTML extraction normalizes text to Unicode NFC without discarding invalid bytes.

## Regenerate and validate Parquet

From the repository root:

```powershell
python -m pip install -r '.\Pendientes\03_Parquet_Dataset\requirements.txt'
& '.\Pendientes\03_Parquet_Dataset\run_parquet_build.ps1'
python '.\Pendientes\03_Parquet_Dataset\validate_parquet_dataset.py' '.\Website\public\data'
```

Publication is atomic. A failed inventory, decode, extraction, schema, checksum, count, or aggregate check does not replace the last valid dataset.

## Test and run the exact static build

From the repository root:

```powershell
npm run website:lint
npm --prefix Website test
npm run website:build
npm run website:start
```

`website:start` builds, verifies, and serves `Website/out`. `website:start:fast` restarts the existing export without rebuilding it.

## Local data transformation

The checked local launcher enables the `Data Transformation` navigation item and starts its loopback-only worker API automatically:

```powershell
npm run website:start
```

The section is omitted from direct static builds used for GitHub Pages. Transformations require a fresh preview and confirmation, stage every yearly Parquet partition, validate the complete result, and publish only after validation succeeds.

## GitHub Pages base path

For a repository named `Aviation-History`, build with the repository-scoped path:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/Aviation-History'
npm run website:build
node '.\Website\scripts\verify-static-export.mjs'
```

The manifest, Parquet, worker, WASM, and Next.js URLs all pass through the same base-path contract. Runtime network access is limited to same-origin static assets.

Do not publish to GitHub until the local exported portal and full dataset validation both pass.
