$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "portable-dist"
$zipPath = Join-Path $outDir "aviation-history-portable-win64.zip"
$stage = Join-Path $outDir "Aviation History"

if (Test-Path $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $stage | Out-Null

$excludeDirs = @(
  ".git",
  "portable-dist",
  "Website\.next",
  "Website\asn_cache",
  "Website\html-data",
  "Website\logs",
  "scraper\data\chrome-cdp-profile",
  "scraper\data\logs",
  "scraper\data\raw",
  "scraper\data\state",
  "scraper\dist"
)

robocopy $root $stage /MIR /XD $excludeDirs /XF "*.log" | Out-Host
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $stage -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "Portable package written to: $zipPath"
