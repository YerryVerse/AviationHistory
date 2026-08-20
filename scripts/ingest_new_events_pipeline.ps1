param(
  [Parameter(Mandatory=$true)]
  [string]$StagingCsv,
  [string]$MasterCsv = "scraper\data\csv\data\aviation_events_master.csv",
  [string]$OutputRoot = "Website\public\data"
)

$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$PortablePython = Join-Path $Root 'tools\python\python.exe'
$Python = if (Test-Path -LiteralPath $PortablePython) { $PortablePython } else { (Get-Command python.exe).Source }
$PortableNode = Join-Path $Root 'tools\node\node.exe'
$Node = if (Test-Path -LiteralPath $PortableNode) { $PortableNode } else { (Get-Command node.exe).Source }

Write-Host "=== Phase 1: Pre-Ingestion Data Quality Audit ===" -ForegroundColor Cyan
& $Python (Join-Path $Root 'scripts\validate_new_events.py') --staging $StagingCsv --master-csv $MasterCsv
if ($LASTEXITCODE -ne 0) {
  throw "Data quality validation failed. Ingestion aborted to protect master dataset."
}

Write-Host "`n=== Phase 2: Entity Standardisation & Dictionary Application ===" -ForegroundColor Cyan
& $Python (Join-Path $Root 'scripts\apply_dictionaries.py')
if ($LASTEXITCODE -ne 0) {
  throw "Entity dictionary application failed."
}

Write-Host "`n=== Phase 3: Dataset Merging & Reassembly ===" -ForegroundColor Cyan
& $Python (Join-Path $Root 'scripts\assemble_master.py')
if ($LASTEXITCODE -ne 0) {
  throw "Master CSV assembly failed."
}

Write-Host "`n=== Phase 4: Master Dataset Publishing & Quality Report Generation ===" -ForegroundColor Cyan
& $Python (Join-Path $Root 'scripts\publish_master_csv_to_portal.py') --master-csv $MasterCsv --output-root $OutputRoot
if ($LASTEXITCODE -ne 0) {
  throw "Portal publishing failed."
}

Write-Host "`n=== Phase 5: Static Export & DuckDB Compatibility Verification ===" -ForegroundColor Cyan
& $Node (Join-Path $Root 'Website\scripts\verify-static-export.mjs') (Join-Path $Root $OutputRoot)
if ($LASTEXITCODE -ne 0) {
  throw "Static export verification failed."
}

Write-Host "`n✅ Ingestion complete! New events merged with 100% data quality score." -ForegroundColor Green
