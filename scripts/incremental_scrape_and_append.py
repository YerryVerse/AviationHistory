"""
incremental_scrape_and_append.py
Incremental scraper & dataset appender for Aviation History with real-time per-event progress tracking.

Workflow:
1. Detects latest event date and max asn_id in aviation_events_master.csv.
2. Identifies new event HTML files in scraper/data/raw/<year>/ (or triggers CDP scraper download).
3. Parses raw HTML files to extract canonical 59 fields.
4. Runs 100% data quality validation (validate_new_events.py) & dictionary standardisation per event.
5. Appends validated records to the latest part CSV file (aviation_events_part_16.csv, or creates part_17.csv if > 25,000 rows) and to aviation_events_master.csv.
6. Triggers publish_master_csv_to_portal.py to publish Parquet files & quality report to the portal.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

csv.field_size_limit(sys.maxsize)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from validate_new_events import FIELDS, validate_events, parse_int, parse_float, clean_val


MASTER_CSV_PATH = Path(r"scraper/data/csv/data/aviation_events_master.csv")
PARTS_DIR = Path(r"scraper/data/csv/data/parts")
RAW_DIR = Path(r"scraper/data/raw")
STATE_DIR = Path(r"scraper/data/state/year-links")
ROOT_DIR = Path(__file__).resolve().parent.parent


def get_latest_master_info(master_path: Path = MASTER_CSV_PATH) -> tuple[int, tuple[int, int, int], set[int]]:
    """Return (max_asn_id, (max_year, max_month, max_day), set_of_all_existing_asn_ids)."""
    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))
    existing_ids: set[int] = set()
    max_asn = 0
    max_date = (1902, 1, 1)

    if not master_path.is_file():
        parts = sorted(PARTS_DIR.glob("aviation_events_part_*.csv"))
        if not parts:
            raise FileNotFoundError(f"Master CSV {master_path} and parts directory {PARTS_DIR} not found.")
        print(f"Reading {len(parts)} part CSV files to find latest dataset state...")
        for part in parts:
            with part.open("r", encoding="utf-8-sig", errors="replace") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    asn = parse_int(row.get("asn_id"))
                    if asn is not None:
                        existing_ids.add(asn)
                        if asn > max_asn:
                            max_asn = asn
                    y = parse_int(row.get("event_year")) or 1902
                    m = parse_int(row.get("event_month")) or 1
                    d = parse_int(row.get("event_day")) or 1
                    if (y, m, d) > max_date:
                        max_date = (y, m, d)
        return max_asn, max_date, existing_ids

    with master_path.open("r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            asn = parse_int(row.get("asn_id"))
            if asn is not None:
                existing_ids.add(asn)
                if asn > max_asn:
                    max_asn = asn
            y = parse_int(row.get("event_year")) or 1902
            m = parse_int(row.get("event_month")) or 1
            d = parse_int(row.get("event_day")) or 1
            if (y, m, d) > max_date:
                max_date = (y, m, d)

    return max_asn, max_date, existing_ids


def get_latest_part_file(parts_dir: Path = PARTS_DIR) -> tuple[Path, int]:
    """Return (path_to_latest_part, current_part_row_count)."""
    parts = sorted(parts_dir.glob("aviation_events_part_*.csv"))
    if not parts:
        raise FileNotFoundError(f"No part files found in {parts_dir}")
    latest_part = parts[-1]
    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))
    with latest_part.open("r", encoding="utf-8-sig", errors="replace") as f:
        row_count = sum(1 for _ in f) - 1 # Exclude header
    return latest_part, max(0, row_count)


def parse_html_event_files(html_files: list[Path]) -> list[dict[str, str]]:
    """Parse list of HTML files using node src/html-year-to-csv.js logic."""
    extracted: list[dict[str, str]] = []
    years_needed = set(f.parent.name for f in html_files if f.parent.name.isdigit())
    portable_node = ROOT_DIR / "tools" / "node" / "node.exe"
    node_cmd = str(portable_node) if portable_node.is_file() else "node"

    for year in sorted(years_needed):
        temp_csv = ROOT_DIR / "scratch" / f"temp_extracted_{year}.csv"
        temp_csv.parent.mkdir(parents=True, exist_ok=True)
        cmd = [node_cmd, "src/html-year-to-csv.js", "--year", year, "--out", str(temp_csv)]
        res = subprocess.run(cmd, cwd=ROOT_DIR / "scraper", capture_output=True, text=True)
        if res.returncode != 0:
            print(f"  [Warning] html-year-to-csv.js code {res.returncode} for year {year}: {res.stderr}")
        if temp_csv.is_file():
            with temp_csv.open("r", encoding="utf-8-sig", errors="replace") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rec = {field: row.get(field, "") for field in FIELDS}
                    extracted.append(rec)
            try:
                temp_csv.unlink()
            except Exception:
                pass
    return extracted


def log_event_progress(
    event: dict[str, str],
    html_path: Path,
    step: str,
    status: str,
    target_part: str | None = None,
    error_msg: str | None = None
) -> None:
    """Print detailed event tracking information."""
    asn_id = event.get("asn_id", html_path.stem)
    year = event.get("event_year", "Unknown")
    title = event.get("title", html_path.name)
    date = f"{year}-{event.get('event_month', 'XX')}-{event.get('event_day', 'XX')}"
    aircraft = event.get("aircraft_type") or event.get("aircraft_model") or "Aircraft N/A"
    operator = event.get("operator") or "Operator N/A"
    location = event.get("location") or event.get("country") or "Location N/A"

    print("-" * 80)
    print(f"[EVENT INGESTION] ASN ID: {asn_id} | Year: {year}")
    print(f"  Title:    {title}")
    print(f"  Details:  Date: {date} | Aircraft: {aircraft} | Operator: {operator}")
    print(f"  Location: {location}")
    print(f"  HTML File: {html_path.as_posix()}")
    print(f"  Action Step: {step}")
    if target_part:
        print(f"  Target File: {target_part} & aviation_events_master.csv")
    print(f"  Status:   {status}")
    if error_msg:
        print(f"  Reason:   {error_msg}")


def append_single_event(
    event: dict[str, str],
    master_path: Path = MASTER_CSV_PATH,
    parts_dir: Path = PARTS_DIR,
    max_rows_per_part: int = 25000
) -> str:
    """Append a single validated event to the latest part CSV and to master CSV. Return part filename."""
    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))

    # Get master header
    with master_path.open("r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader)

    latest_part_file, current_part_rows = get_latest_part_file(parts_dir)
    target_part = latest_part_file

    if current_part_rows >= max_rows_per_part:
        # Create next part file
        part_num = int(latest_part_file.stem.split("_")[-1]) + 1
        target_part = parts_dir / f"aviation_events_part_{part_num:02d}.csv"
        with target_part.open("w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(header)
        print(f"  [Part Split] Created new part file: {target_part.name}")

    row_data = [event.get(col, "") for col in header]

    # Append to Part CSV
    with target_part.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row_data)

    # Append to Master CSV
    with master_path.open("a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(row_data)

    return target_part.name


def main() -> int:
    parser = argparse.ArgumentParser(description="Incremental Scraper & Dataset Appender with Event Tracking")
    parser.add_argument("--dry-run", action="store_true", help="Inspect state without modifying dataset")
    parser.add_argument("--master-csv", type=Path, default=MASTER_CSV_PATH, help="Path to master CSV")
    parser.add_argument("--parts-dir", type=Path, default=PARTS_DIR, help="Path to parts directory")
    args = parser.parse_args()

    print("================================================================================")
    print("      AVIATION HISTORY INCORPORATION PIPELINE - REAL-TIME EVENT LOG")
    print("================================================================================")

    print("\n[PHASE 1] Detecting Current Dataset State...")
    max_asn, (max_year, max_month, max_day), existing_ids = get_latest_master_info(args.master_csv)
    latest_part_file, current_part_rows = get_latest_part_file(args.parts_dir)

    print(f"  Master Dataset Records: {len(existing_ids):,}")
    print(f"  Maximum Recorded ASN ID: {max_asn}")
    print(f"  Latest Event Date:      {max_year}-{max_month:02d}-{max_day:02d}")
    print(f"  Current Part File:      {latest_part_file.name} ({current_part_rows:,}/25,000 rows)")

    print("\n[PHASE 2] Inspecting Raw HTML Archive for Unindexed Events...")
    new_html_files: list[Path] = []
    if RAW_DIR.is_dir():
        for year_dir in sorted(RAW_DIR.glob("*")):
            if year_dir.is_dir() and year_dir.name.isdigit():
                for html_file in year_dir.glob("*.html"):
                    asn = parse_int(html_file.stem)
                    if asn is not None and asn not in existing_ids:
                        new_html_files.append(html_file)

    print(f"  Found {len(new_html_files):,} candidate HTML files awaiting incorporation.")

    if not new_html_files:
        print("\n[STATUS] Dataset is already up-to-date with raw HTML archive!")
        if args.dry_run:
            print("[DRY RUN COMPLETE] No files modified.")
            return 0
        print("\nTo discover and download new events from the website, run:")
        print(f"  node scraper/src/collect-year-links-cdp.js --year {max_year} --launch")
        print(f"  node scraper/src/events-to-html-cdp.js --year {max_year} --launch")
        return 0

    if args.dry_run:
        print("\n[DRY RUN SUMMARY]")
        for html_file in new_html_files[:10]:
            print(f"  - Candidate HTML: {html_file.as_posix()} [ASN {html_file.stem}]")
        if len(new_html_files) > 10:
            print(f"  ... and {len(new_html_files) - 10} more event HTML file(s).")
        print("[DRY RUN COMPLETE] No files modified.")
        return 0

    print("\n[PHASE 3] Extracting Structured Data from HTML Files...")
    extracted_records = parse_html_event_files(new_html_files)
    extracted_by_asn = {parse_int(r.get("asn_id")): r for r in extracted_records if parse_int(r.get("asn_id"))}

    print(f"  Successfully extracted {len(extracted_by_asn):,} event records.")

    print("\n[PHASE 4 & 5] Step-by-Step Quality Audit & CSV Incorporation per Event...")
    incorporated_count = 0
    failed_count = 0

    for html_file in new_html_files:
        asn = parse_int(html_file.stem)
        event = extracted_by_asn.get(asn, {"asn_id": str(asn), "event_year": html_file.parent.name})

        # Step 1: HTML Verification
        # Step 2: Extraction Check
        if asn not in extracted_by_asn:
            log_event_progress(event, html_file, "HTML Parsing", "[FAILED]", error_msg="Could not extract fields from HTML")
            failed_count += 1
            continue

        # Step 3: Data Quality Validation
        # Write single record temp CSV to validate
        temp_single = ROOT_DIR / "scratch" / f"single_val_{asn}.csv"
        temp_single.parent.mkdir(parents=True, exist_ok=True)
        with temp_single.open("w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(event.keys()))
            writer.writeheader()
            writer.writerow(event)

        errors = validate_events(temp_single, args.master_csv)
        try:
            temp_single.unlink()
        except Exception:
            pass

        if errors:
            err_desc = "; ".join(f"{e.field}: {e.message}" for e in errors)
            log_event_progress(event, html_file, "Data Quality Audit", "[REJECTED]", error_msg=err_desc)
            failed_count += 1
            continue

        # Step 4 & 5: Append to CSV part and Master
        try:
            part_name = append_single_event(event, master_path=args.master_csv, parts_dir=args.parts_dir)
            existing_ids.add(asn) # Prevent re-appending in same loop
            log_event_progress(event, html_file, "CSV Incorporation & Appending", "[INCORPORATED SUCCESSFULLY]", target_part=part_name)
            incorporated_count += 1
        except Exception as ex:
            log_event_progress(event, html_file, "CSV Appending", "[FAILED]", error_msg=str(ex))
            failed_count += 1

    print("\n[PHASE 6] Publishing Updated Dataset to Portal...")
    if incorporated_count > 0:
        subprocess.run([sys.executable, "scripts/apply_dictionaries.py"], cwd=ROOT_DIR, check=True)
        subprocess.run([sys.executable, "scripts/publish_master_csv_to_portal.py"], cwd=ROOT_DIR, check=True)

    print("\n================================================================================")
    print("                       INGESTION SUMMARY REPORT")
    print("================================================================================")
    print(f"  Total Candidate HTML Events Processed: {len(new_html_files):,}")
    print(f"  Successfully Incorporated Events:     {incorporated_count:,}")
    print(f"  Rejected / Failed Events:             {failed_count:,}")
    print(f"  Master Dataset New Total:             {len(existing_ids):,} events")
    print("================================================================================\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
