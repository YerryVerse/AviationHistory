# Aviation History

Monorepo for two local projects:

- `Website`: Next.js data science website for aviation safety analytics.
- `scraper`: local ASN HTML archiver and scraper portal.

## Portable Windows Run

This folder includes portable Windows runtimes under `tools/`:

- `tools/node`: Node.js and npm.
- `tools/python`: Python and Python packages used by the Python utilities.
- `tools/chrome`: Chrome for Testing for CDP scraper scripts.

To run the portfolio on another Windows computer, copy this whole project folder and run:

```powershell
.\START_PORTABLE.cmd
```

or:

```powershell
.\START_PORTABLE.ps1
```

This starts:

- Website: `http://localhost:3000`
- Scraper API: `http://localhost:8787`
- Scraper portal: `http://localhost:5173`

Stop all services with `Ctrl+C`.

## Requirements For Reinstalling Dependencies

- Node.js 20 or newer.
- npm.
- Google Chrome, only for CDP scraper scripts. If Chrome is not installed in a standard location, set `CHROME_PATH`.
- Optional: Ollama running locally at `http://localhost:11434` for XML/narrative AI extraction features.

These are only needed if the bundled `tools/` or `node_modules/` folders are removed and you want to rebuild dependencies from scratch.

## Rebuild Dependencies

From the repository root:

```powershell
npm run install:all
```

## Developer Run With Installed Node

If Node is installed on the computer, this also starts everything in one terminal:

```powershell
npm run dev
```

You can also start each part separately.

Website:

```powershell
npm run website:dev
```

Open:

```text
http://localhost:3000
```

Start the scraper backend:

```powershell
npm run scraper:server
```

In another terminal, start the scraper portal:

```powershell
npm run scraper:dev
```

Open:

```text
http://localhost:5173
```

## Portable Data Layout

The project uses relative paths, so it can be copied to another folder or computer.

Tracked source data:

- `Website/data_ready_csv`
- `scraper/data/source/wikibase.html`

Generated local data is intentionally ignored by Git:

- `scraper/data/raw`
- `scraper/data/state`
- `scraper/data/logs`
- `scraper/data/chrome-cdp-profile`
- `Website/asn_cache`
- `Website/html-data`
- `Website/logs`
- `Website/.next`
- `node_modules`

If you want to move generated scraper results to another computer, copy `scraper/data/raw` and `scraper/data/state` manually with the project folder.

## Version Files And Bundled Runtimes

Version and dependency files are kept in the project:

- `.nvmrc`: Node major version for nvm-compatible tools.
- `.python-version`: Python version for pyenv-compatible tools.
- `Website/package-lock.json`: locked website Node dependencies, including Next/Vite-related transitive packages.
- `scraper/package-lock.json`: locked scraper Node dependencies, including Vite.
- `Website/requirements.txt`: Python dependencies used by Streamlit/Python utilities.
- `tools/node`: bundled Node.js/npm runtime for Windows.
- `tools/python`: bundled Python runtime and installed packages for Windows.
- `tools/chrome`: bundled Chrome for Testing for Windows.

For a fully portable copy, keep these folders:

- `tools`
- `Website/node_modules`
- `scraper/node_modules`

These folders are intentionally ignored by Git because they are large binary/runtime folders. They must still be present when copying the portfolio folder or building a portable ZIP.

To build a portable Windows ZIP from this machine:

```powershell
npm run package:portable
```

The ZIP is created under `portable-dist/`.

For Python utilities, create a virtual environment from the root or from `Website`:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r Website\requirements.txt
```

## Chrome Path

The CDP scraper scripts look for Chrome in common Windows, macOS, and Linux locations. For a custom install:

```powershell
$env:CHROME_PATH = "C:\Path\To\chrome.exe"
```

Then run the CDP script from `scraper`, for example:

```powershell
node src/collect-year-links-cdp.js --year 2026 --launch
```
