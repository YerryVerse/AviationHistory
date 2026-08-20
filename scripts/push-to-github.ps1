# GitHub Push with Live Interactive Progress
[Console]::Title = "GitHub Upload - AviationHistory"
$Host.UI.RawUI.WindowTitle = "GitHub Upload - AviationHistory"

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "   Aviation History Research Portal - GitHub Upload Process" -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host " Repository : https://github.com/YerryVerse/AviationHistory.git" -ForegroundColor Yellow
Write-Host " Branch     : main" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "t:\AI\Aviation History"

Write-Host "[1/2] Verifying git remote..." -ForegroundColor Green
git remote -v
Write-Host ""

Write-Host "[2/2] Pushing code, databases, and assets to GitHub..." -ForegroundColor Green
Write-Host "      (Live progress bar will appear below)" -ForegroundColor Gray
Write-Host ""

git push -u origin main --progress

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host " Process finished! Press any key or close this window." -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
