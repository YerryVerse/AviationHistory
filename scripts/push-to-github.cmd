@echo off
title GitHub Upload - AviationHistory
cd /d "%~dp0\.."
echo =======================================================================
echo   Aviation History Research Portal - GitHub Upload Process
echo =======================================================================
echo   Repository: https://github.com/YerryVerse/AviationHistory.git
echo   Branch:     main
echo =======================================================================
echo.
echo [1/2] Verifying remote origin...
git remote -v
echo.
echo [2/2] Pushing code, databases, and assets with live progress...
echo.
git push -u origin main --progress
echo.
echo =======================================================================
echo   Push execution completed!
echo =======================================================================
echo.
pause
