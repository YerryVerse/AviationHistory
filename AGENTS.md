## Windows PowerShell Command Safety

- Do not use `Start-Process` to run PowerShell cmdlets such as `Start-Sleep`, `Set-Location`, `Copy-Item`, or command strings that contain semicolons, pipelines, or multiple statements.
- Launch long-running project processes through checked scripts or real executables with explicit arguments.
- Keep process launch, waiting, and verification as separate shell operations when possible.
- Use the existing scraper and portal launcher scripts instead of ad hoc inline PowerShell command chains.
- Launch the website portal with `npm run website:start` or `npm run website:start:fast`; avoid `next dev` unless the user explicitly needs hot reload.

## Strict Exact Data Unrounded Rule
- NEVER use rounded numbers anywhere across any KPI card or analytics dashboard component.
- Always use exact, unrounded integer counts calculated directly from the Parquet/DuckDB dataset.

