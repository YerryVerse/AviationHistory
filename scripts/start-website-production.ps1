param(
  [int]$Port = 3000,
  [int]$TransformationPort = 8787,
  [string]$Hostname = '127.0.0.1',
  [switch]$SkipBuild,
  [switch]$Wait
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$Root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$Website = Join-Path $Root 'Website'
$PortableNode = Join-Path $Root 'tools\node\node.exe'
$PortableNpm = Join-Path $Root 'tools\node\npm.cmd'
$Node = if (Test-Path -LiteralPath $PortableNode) { $PortableNode } else { (Get-Command node.exe).Source }
$Npm = if (Test-Path -LiteralPath $PortableNpm) { $PortableNpm } else { (Get-Command npm.cmd).Source }
$ServeJs = Join-Path $Website 'node_modules\serve\build\main.js'
$ServeCmd = Join-Path $Website 'node_modules\.bin\serve.cmd'
$ServeBin = if (Test-Path -LiteralPath $ServeJs) { $ServeJs } else { $ServeCmd }
$TransformationServer = Join-Path $Root 'scraper\src\server.js'
$OutDir = Join-Path $Website 'out'
$LogDir = Join-Path $Website '.logs'
$OutLog = Join-Path $LogDir 'static-server.out.log'
$ErrLog = Join-Path $LogDir 'static-server.err.log'
$TransformationOutLog = Join-Path $LogDir 'data-admin-server.out.log'
$TransformationErrLog = Join-Path $LogDir 'data-admin-server.err.log'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Stop-ProcessOnPort([int]$TargetPort) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $TargetPort -ErrorAction SilentlyContinue
    if ($conns) {
      foreach ($conn in $conns) {
        if ($conn.OwningProcess -and $conn.OwningProcess -gt 4) {
          Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
      }
    }
  } catch {}
}

# Always ensure target web port 3000 is clean before starting
Stop-ProcessOnPort $Port

$existing = Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine.Contains($ServeBin) -and
    $_.CommandLine.Contains($OutDir)
  }

foreach ($process in $existing) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

if (-not $SkipBuild) {
  $PreviousDataAdmin = $env:NEXT_PUBLIC_ENABLE_DATA_ADMIN
  try {
    $env:NEXT_PUBLIC_ENABLE_DATA_ADMIN = 'true'
    & $Npm --prefix $Website run build
    if ($LASTEXITCODE -ne 0) { throw "Website build failed with exit code $LASTEXITCODE." }
  }
  finally {
    $env:NEXT_PUBLIC_ENABLE_DATA_ADMIN = $PreviousDataAdmin
  }
  & $Node (Join-Path $Website 'scripts\verify-static-export.mjs')
  if ($LASTEXITCODE -ne 0) { throw "Static export verification failed with exit code $LASTEXITCODE." }
}

if (-not (Test-Path -LiteralPath $OutDir -PathType Container)) {
  throw "Static export does not exist at $OutDir. Run npm run website:start without -SkipBuild first."
}

function Test-TransformationService {
  try {
    $response = Invoke-RestMethod `
      -Uri "http://127.0.0.1:${TransformationPort}/api/status" `
      -Method Get `
      -TimeoutSec 3
    return $null -ne $response
  }
  catch {
    return $false
  }
}

function Test-WebsiteService {
  try {
    $response = Invoke-WebRequest `
      -Uri "http://${Hostname}:${Port}/" `
      -Method Get `
      -TimeoutSec 3 `
      -UseBasicParsing
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

$transformationProcess = $null
if (-not (Test-TransformationService)) {
  Stop-ProcessOnPort $TransformationPort

  $existingTransformationProcesses = Get-CimInstance Win32_Process |
    Where-Object {
      $_.CommandLine -and $_.CommandLine.Contains($TransformationServer)
    }

  foreach ($process in $existingTransformationProcesses) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  $transformationProcess = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList @('/c', "`"set PORT=$TransformationPort && `"$Node`" `"$TransformationServer`" > `"$TransformationOutLog`" 2>&1`"") `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -PassThru

  $transformationReady = $false
  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    if (Test-TransformationService) {
      $transformationReady = $true
      break
    }
  }
  if (-not $transformationReady) {
    $details = if (Test-Path -LiteralPath $TransformationOutLog) {
      (Get-Content -LiteralPath $TransformationOutLog -Tail 20) -join [Environment]::NewLine
    }
    else {
      'No error log was produced.'
    }
    throw "Data transformation service failed to start on port $TransformationPort.`n$details"
  }
}

$serveCmdLine = if ($ServeBin.EndsWith('.js')) {
  "`"$Node`" `"$ServeBin`" -s `"$OutDir`" -l $Port"
} else {
  "`"$ServeBin`" -s `"$OutDir`" -l $Port"
}
$server = Start-Process `
  -FilePath 'cmd.exe' `
  -ArgumentList @('/c', "`"$serveCmdLine > `"$OutLog`" 2>&1`"") `
  -WorkingDirectory $Website `
  -WindowStyle Hidden `
  -PassThru

$websiteReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
  Start-Sleep -Milliseconds 250
  if (Test-WebsiteService) {
    $websiteReady = $true
    break
  }
}

if (-not $websiteReady) {
  $details = if (Test-Path -LiteralPath $OutLog) {
    (Get-Content -LiteralPath $OutLog -Tail 20) -join [Environment]::NewLine
  } else {
    'No log output produced.'
  }
  throw "Website portal server failed to respond on http://${Hostname}:${Port}.`n$details"
}

Write-Host "Static website server started and verified online." -ForegroundColor Green
Write-Host "URL: http://${Hostname}:${Port}" -ForegroundColor Cyan
Write-Host "PID: $($server.Id)" -ForegroundColor Cyan
Write-Host "Logs: $OutLog" -ForegroundColor DarkGray
if ($transformationProcess) {
  Write-Host "Data transformation API started." -ForegroundColor Green
  Write-Host "Data transformation API: http://127.0.0.1:$TransformationPort" -ForegroundColor Cyan
  Write-Host "Data transformation PID: $($transformationProcess.Id)" -ForegroundColor Cyan
}
else {
  Write-Host "Data transformation API already running: http://127.0.0.1:$TransformationPort" -ForegroundColor Cyan
}
Write-Host "Data transformation logs: $TransformationOutLog" -ForegroundColor DarkGray

if ($Wait) {
  Write-Host "Waiting for server process to run... Press Ctrl+C to stop." -ForegroundColor Yellow
  while ($true) {
    Start-Sleep -Seconds 3600
  }
}
