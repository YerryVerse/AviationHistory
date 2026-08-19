from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

import pandas as pd


REFERENCE_COLUMNS = [
    "asn_id",
    "source_url",
    "title",
    "occurrence_name",
    "date_raw",
    "event_date",
    "event_year",
    "event_month",
    "event_day",
    "event_weekday",
    "time_raw",
    "local_time",
    "time_zone",
    "aircraft_type",
    "aircraft_name",
    "aircraft_manufacturer",
    "aircraft_model",
    "aircraft_variant",
    "operator",
    "registration",
    "msn",
    "year_of_manufacture",
    "engine_model",
    "occupants",
    "fatalities_onboard",
    "survivors_onboard",
    "fatalities_ground",
    "fatalities_total",
    "survival_rate_onboard",
    "fatality_rate_onboard",
    "aircraft_damage",
    "category",
    "location_raw",
    "location",
    "country",
    "phase_raw",
    "phase",
    "phase_label",
    "phase_group",
    "nature",
    "departure_airport_raw",
    "departure_airport",
    "departure_iata",
    "departure_icao",
    "destination_airport_raw",
    "destination_airport",
    "destination_iata",
    "destination_icao",
    "investigating_agency",
    "confidence_rating",
    "narrative",
    "narrative_chars",
    "approx_location_from_narrative",
    "fatality_nationalities",
    "fatality_nationalities_total",
    "weather_or_visibility_mentioned",
]


MISSING_STRINGS = {"", "nan", "none", "null", "na", "n/a"}


def is_missing(series: pd.Series) -> pd.Series:
    return series.isna() | series.astype(str).str.strip().str.lower().isin(MISSING_STRINGS)


def clean_text(value) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def build_occurrence_name(row: pd.Series) -> str:
    aircraft_name = clean_text(row.get("aircraft_name"))
    aircraft_type = clean_text(row.get("aircraft_type"))
    registration = clean_text(row.get("registration"))
    date_raw = clean_text(row.get("date_raw"))
    asn_id = clean_text(row.get("asn_id"))
    title = clean_text(row.get("title"))

    aircraft = aircraft_name or aircraft_type
    if aircraft.lower().startswith("owner/operator:"):
        aircraft = ""
    if registration.lower().startswith("msn:"):
        registration = ""

    parts = [part for part in [aircraft, registration] if part]
    if parts:
        name = " ".join(parts)
        return f"{name}, {date_raw}" if date_raw else name

    if title and "," in title:
        title_name = title.split(",", 1)[0].strip()
        if title_name and title_name.lower() not in {"accident", "incident"}:
            return title_name

    return f"ASN Wikibase {asn_id}" if asn_id else "Unknown occurrence"


def normalize_phase_group(df: pd.DataFrame) -> pd.DataFrame:
    if "phase_group" not in df.columns:
        return df
    mapping = {
        "en_tierra": "ground",
        "despegue": "takeoff",
        "en_vuelo": "in_flight",
        "aterrizaje": "landing",
        "desconocida": "unknown",
        "otra": "other",
    }
    df["phase_group"] = df["phase_group"].replace(mapping)
    return df


def clear_label_leakage(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Clears values that are actually scraped field labels, not data."""
    leakage_patterns = {
        "aircraft_type": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "aircraft_name": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "aircraft_manufacturer": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "aircraft_model": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "registration": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "msn": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "year_of_manufacture": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
        "engine_model": ["Owner/operator:", "Registration:", "MSN:", "Fatalities:"],
    }
    repaired = 0
    for column, patterns in leakage_patterns.items():
        if column not in df.columns:
            continue
        mask = pd.Series(False, index=df.index)
        values = df[column].astype("string").fillna("")
        for pattern in patterns:
            mask = mask | values.str.startswith(pattern, na=False)
        repaired += int(mask.sum())
        df.loc[mask, column] = pd.NA
    return df, repaired


def repair_csv(path: Path, output_path: Path | None, backup: bool) -> dict:
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)

    missing_columns = [col for col in REFERENCE_COLUMNS if col not in df.columns]
    extra_columns = [col for col in df.columns if col not in REFERENCE_COLUMNS]
    if missing_columns or extra_columns:
        raise ValueError(
            f"Schema mismatch. Missing columns={missing_columns}; extra columns={extra_columns}"
        )

    df = df[REFERENCE_COLUMNS].copy()

    text_columns = [
        "asn_id",
        "source_url",
        "title",
        "occurrence_name",
        "date_raw",
        "event_date",
        "event_weekday",
        "time_raw",
        "local_time",
        "time_zone",
        "aircraft_type",
        "aircraft_name",
        "aircraft_manufacturer",
        "aircraft_model",
        "aircraft_variant",
        "operator",
        "registration",
        "msn",
        "year_of_manufacture",
        "engine_model",
        "aircraft_damage",
        "category",
        "location_raw",
        "location",
        "country",
        "phase_raw",
        "phase",
        "phase_label",
        "phase_group",
        "nature",
        "departure_airport_raw",
        "departure_airport",
        "departure_iata",
        "departure_icao",
        "destination_airport_raw",
        "destination_airport",
        "destination_iata",
        "destination_icao",
        "investigating_agency",
        "confidence_rating",
        "narrative",
        "approx_location_from_narrative",
        "fatality_nationalities",
        "weather_or_visibility_mentioned",
    ]
    for column in text_columns:
        if column in df.columns:
            df[column] = df[column].astype("string")

    country_missing = is_missing(df["country"])
    location_available = ~is_missing(df["location"])
    country_repaired = int((country_missing & location_available).sum())
    df.loc[country_missing & location_available, "country"] = df.loc[
        country_missing & location_available, "location"
    ]

    occurrence_missing = is_missing(df["occurrence_name"])
    occurrence_repaired = int(occurrence_missing.sum())
    if occurrence_repaired:
        df.loc[occurrence_missing, "occurrence_name"] = df.loc[
            occurrence_missing
        ].apply(build_occurrence_name, axis=1)

    df = normalize_phase_group(df)
    df, label_leakage_repaired = clear_label_leakage(df)

    out = output_path or path
    if backup and out == path:
        backup_path = path.with_suffix(path.suffix + ".bak")
        if not backup_path.exists():
            shutil.copy2(path, backup_path)

    df.to_csv(out, index=False, encoding="utf-8-sig")

    duplicate_urls = int(df["source_url"].duplicated().sum())
    duplicate_ids = int(df["asn_id"].duplicated().sum())
    remaining_country_missing = int(is_missing(df["country"]).sum())
    remaining_occurrence_missing = int(is_missing(df["occurrence_name"]).sum())

    return {
        "path": str(out),
        "rows": len(df),
        "columns": len(df.columns),
        "country_repaired": country_repaired,
        "occurrence_name_repaired": occurrence_repaired,
        "label_leakage_repaired": label_leakage_repaired,
        "remaining_country_missing": remaining_country_missing,
        "remaining_occurrence_name_missing": remaining_occurrence_missing,
        "duplicate_source_url": duplicate_urls,
        "duplicate_asn_id": duplicate_ids,
        "event_year_min": str(df["event_year"].min()),
        "event_year_max": str(df["event_year"].max()),
        "event_date_min": str(df["event_date"].min()),
        "event_date_max": str(df["event_date"].max()),
    }


def normalized_imported_filename(path: Path) -> Path:
    """Normalizes imported Wikibase files to asn_wikibase_YEAR.csv."""
    pattern = re.compile(
        r"^(?P<prefix>asn_wikibase)_(?P<year>\d{4})(?:_\d{4}-\d{2}-\d{2}|-\d{2}-\d{2})?(?P<suffix>\.csv(?:\.bak)?)$"
    )
    match = pattern.match(path.name)
    if not match:
        return path
    return path.with_name(f"{match.group('prefix')}_{match.group('year')}{match.group('suffix')}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--no-backup", action="store_true")
    parser.add_argument("--no-rename", action="store_true")
    args = parser.parse_args()

    report = repair_csv(args.path, args.output, backup=not args.no_backup)
    if not args.no_rename and args.output is None:
        current_path = Path(report["path"])
        normalized_path = normalized_imported_filename(current_path)
        if normalized_path != current_path:
            if normalized_path.exists():
                raise FileExistsError(f"Cannot rename because target exists: {normalized_path}")
            current_path.rename(normalized_path)
            report["path"] = str(normalized_path)
            report["renamed_to"] = str(normalized_path)
    for key, value in report.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
