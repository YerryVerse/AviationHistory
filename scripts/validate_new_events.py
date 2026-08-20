"""
validate_new_events.py
Pre-ingestion validation tool to enforce 100% data quality rules for new aviation events
before merging into aviation_events_master.csv.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import sys
from pathlib import Path
from typing import Any, NamedTuple

csv.field_size_limit(sys.maxsize)


FIELDS = [
    "asn_id", "title", "category", "icao_occurrence_category", "confidence_rating",
    "event_date", "event_year", "event_month", "event_day", "event_weekday",
    "local_time", "aircraft_type", "aircraft_designation", "aircraft_manufacturer",
    "aircraft_name", "aircraft_model", "aircraft_variant", "aircraft_common_name",
    "operator", "registration", "msn", "year_of_manufacture", "engine_model",
    "cycles", "total_airframe_hrs", "aircraft_damage", "aircraft_disposition",
    "history_of_this_aircraft", "occupants", "fatalities_onboard", "survivors_onboard",
    "fatalities_ground", "fatalities_total", "survival_rate_onboard", "fatality_rate_onboard",
    "location", "country", "continent", "region", "gps_latitude", "gps_longitude",
    "phase", "phase_group", "nature", "departure_airport",
    "departure_iata", "destination_airport", "destination_iata", "metar",
    "weather_or_visibility_mentioned", "investigating_agency",
    "accident_investigation_duration", "accident_investigation_report",
    "accident_investigation_report_number", "accident_investigation_status",
    "narrative", "aircraft_image_url",
]

INT_FIELDS = {
    "asn_id", "event_year", "occupants", "fatalities_onboard",
    "survivors_onboard", "fatalities_ground", "fatalities_total",
}
FLOAT_FIELDS = {
    "survival_rate_onboard", "fatality_rate_onboard", "gps_latitude", "gps_longitude",
}
REQUIRED_FIELDS = {"asn_id", "event_year"}
_UNKNOWN_TOKENS = {"unknown", "nan", "none", "n/a", "", "-", "undefined", "blank", "database_null"}


class ValidationError(NamedTuple):
    row_num: int
    asn_id: str
    field: str
    message: str


def clean_val(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if text.lower() in _UNKNOWN_TOKENS:
        return None
    return text


def parse_int(val: Any) -> int | None:
    text = clean_val(val)
    if text is None:
        return None
    try:
        return int(float(text.replace(",", "")))
    except ValueError:
        return None


def parse_float(val: Any) -> float | None:
    text = clean_val(val)
    if text is None:
        return None
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


def load_existing_asn_ids(master_csv_path: Path) -> set[int]:
    existing: set[int] = set()
    if not master_csv_path.is_file():
        parts_dir = master_csv_path.parent / "parts"
        if parts_dir.is_dir():
            for part in parts_dir.glob("aviation_events_part_*.csv"):
                with part.open("r", encoding="utf-8-sig", errors="replace") as f:
                    r = csv.DictReader(f)
                    for row in r:
                        asn = parse_int(row.get("asn_id"))
                        if asn is not None:
                            existing.add(asn)
        return existing

    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))
    with master_csv_path.open("r", encoding="utf-8-sig", errors="replace") as f:
        r = csv.DictReader(f)
        for row in r:
            asn = parse_int(row.get("asn_id"))
            if asn is not None:
                existing.add(asn)
    return existing


def validate_events(staging_csv_path: Path, master_csv_path: Path | None = None) -> list[ValidationError]:
    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))
    errors: list[ValidationError] = []
    
    existing_ids = load_existing_asn_ids(master_csv_path) if master_csv_path else set()
    seen_in_staging: set[int] = set()

    current_year = dt.date.today().year

    with staging_csv_path.open("r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return [ValidationError(0, "N/A", "header", "Staging CSV has no header")]

        # Field check
        missing_fields = [field for field in FIELDS if field != "event_date" and field not in reader.fieldnames]
        if missing_fields:
            errors.append(ValidationError(0, "N/A", "schema", f"Staging CSV missing canonical fields: {missing_fields}"))

        for idx, row in enumerate(reader, start=2):
            asn_str = str(row.get("asn_id", "")).strip()
            asn_id = parse_int(asn_str)

            # 1. Mandatory & Uniqueness Check
            if asn_id is None:
                errors.append(ValidationError(idx, asn_str, "asn_id", "asn_id is missing or invalid integer"))
                continue

            if asn_id in existing_ids:
                errors.append(ValidationError(idx, str(asn_id), "asn_id", f"Duplicate asn_id {asn_id} already exists in master dataset"))
            if asn_id in seen_in_staging:
                errors.append(ValidationError(idx, str(asn_id), "asn_id", f"Duplicate asn_id {asn_id} appears multiple times in staging CSV"))
            seen_in_staging.add(asn_id)

            # 2. Year Validation
            year = parse_int(row.get("event_year"))
            if year is None:
                errors.append(ValidationError(idx, str(asn_id), "event_year", "event_year is missing or non-numeric"))
            elif year < 1902 or year > current_year + 1:
                errors.append(ValidationError(idx, str(asn_id), "event_year", f"event_year {year} out of bounds (1902–{current_year+1})"))

            # 3. Numeric Types Validation
            for int_col in INT_FIELDS:
                if int_col in {"asn_id", "event_year"}:
                    continue
                raw_v = row.get(int_col)
                if clean_val(raw_v) is not None and parse_int(raw_v) is None:
                    errors.append(ValidationError(idx, str(asn_id), int_col, f"Field '{int_col}' value '{raw_v}' is not a valid integer"))

            for float_col in FLOAT_FIELDS:
                raw_v = row.get(float_col)
                if clean_val(raw_v) is not None and parse_float(raw_v) is None:
                    errors.append(ValidationError(idx, str(asn_id), float_col, f"Field '{float_col}' value '{raw_v}' is not a valid float"))

            # 4. Casualty & Occupant Math Integrity
            occupants = parse_int(row.get("occupants"))
            fat_onboard = parse_int(row.get("fatalities_onboard"))
            surv_onboard = parse_int(row.get("survivors_onboard"))
            fat_ground = parse_int(row.get("fatalities_ground"))
            fat_total = parse_int(row.get("fatalities_total"))

            if occupants is not None and occupants < 0:
                errors.append(ValidationError(idx, str(asn_id), "occupants", f"occupants cannot be negative ({occupants})"))
            if fat_onboard is not None and fat_onboard < 0:
                errors.append(ValidationError(idx, str(asn_id), "fatalities_onboard", f"fatalities_onboard cannot be negative ({fat_onboard})"))
            if surv_onboard is not None and surv_onboard < 0:
                errors.append(ValidationError(idx, str(asn_id), "survivors_onboard", f"survivors_onboard cannot be negative ({surv_onboard})"))
            if fat_ground is not None and fat_ground < 0:
                errors.append(ValidationError(idx, str(asn_id), "fatalities_ground", f"fatalities_ground cannot be negative ({fat_ground})"))
            if fat_total is not None and fat_total < 0:
                errors.append(ValidationError(idx, str(asn_id), "fatalities_total", f"fatalities_total cannot be negative ({fat_total})"))

            if occupants is not None and fat_onboard is not None:
                if fat_onboard > occupants:
                    errors.append(ValidationError(idx, str(asn_id), "fatalities_onboard", f"fatalities_onboard ({fat_onboard}) > occupants ({occupants})"))

            if occupants is not None and fat_onboard is not None and surv_onboard is not None:
                if surv_onboard != (occupants - fat_onboard):
                    errors.append(ValidationError(idx, str(asn_id), "survivors_onboard", f"survivors_onboard ({surv_onboard}) != occupants ({occupants}) - fatalities_onboard ({fat_onboard})"))

            if fat_onboard is not None and fat_ground is not None and fat_total is not None:
                if fat_total != (fat_onboard + fat_ground):
                    errors.append(ValidationError(idx, str(asn_id), "fatalities_total", f"fatalities_total ({fat_total}) != fatalities_onboard ({fat_onboard}) + fatalities_ground ({fat_ground})"))

            # Rates
            surv_rate = parse_float(row.get("survival_rate_onboard"))
            fat_rate = parse_float(row.get("fatality_rate_onboard"))
            if surv_rate is not None and (surv_rate < 0.0 or surv_rate > 100.0):
                errors.append(ValidationError(idx, str(asn_id), "survival_rate_onboard", f"survival_rate_onboard {surv_rate} out of bounds [0, 100]"))
            if fat_rate is not None and (fat_rate < 0.0 or fat_rate > 100.0):
                errors.append(ValidationError(idx, str(asn_id), "fatality_rate_onboard", f"fatality_rate_onboard {fat_rate} out of bounds [0, 100]"))

            # 5. GPS Bounds
            lat = parse_float(row.get("gps_latitude"))
            lng = parse_float(row.get("gps_longitude"))
            if lat is not None and (lat < -90.0 or lat > 90.0):
                errors.append(ValidationError(idx, str(asn_id), "gps_latitude", f"gps_latitude {lat} out of range [-90, 90]"))
            if lng is not None and (lng < -180.0 or lng > 180.0):
                errors.append(ValidationError(idx, str(asn_id), "gps_longitude", f"gps_longitude {lng} out of range [-180, 180]"))

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate new aviation events CSV before master ingestion.")
    parser.add_argument("--staging", type=Path, required=True, help="Path to staging CSV containing new events")
    parser.add_argument("--master-csv", type=Path, default=Path("scraper/data/csv/data/aviation_events_master.csv"), help="Path to master CSV")
    args = parser.parse_args()

    if not args.staging.is_file():
        print(f"Error: Staging CSV not found at {args.staging}", file=sys.stderr)
        return 1

    print(f"Validating staging events in {args.staging} against master at {args.master_csv} ...")
    errors = validate_events(args.staging, args.master_csv)

    if errors:
        print(f"\n[FAIL] Validation failed! Found {len(errors)} data quality violation(s):\n")
        for err in errors[:25]:
            print(f"  Line {err.row_num} [ASN {err.asn_id}] | Field: {err.field} | {err.message}")
        if len(errors) > 25:
            print(f"  ... and {len(errors) - 25} more error(s).")
        return 1

    print("[OK] All new events passed 100% data quality validation!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
