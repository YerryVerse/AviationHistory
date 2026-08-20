from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path
import shutil
from typing import Any

csv.field_size_limit(10_000_000)

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq


SCHEMA_VERSION = "1.0.0"

FIELDS = [
    "asn_id",
    "title",
    "category",
    "icao_occurrence_category",
    "confidence_rating",
    "event_date",
    "event_year",
    "event_month",
    "event_day",
    "event_weekday",
    "local_time",
    "aircraft_type",
    "aircraft_designation",
    "aircraft_manufacturer",
    "aircraft_name",
    "aircraft_model",
    "aircraft_variant",
    "aircraft_common_name",
    "operator",
    "registration",
    "msn",
    "year_of_manufacture",
    "engine_model",
    "cycles",
    "total_airframe_hrs",
    "aircraft_damage",
    "aircraft_disposition",
    "history_of_this_aircraft",
    "occupants",
    "fatalities_onboard",
    "survivors_onboard",
    "fatalities_ground",
    "fatalities_total",
    "survival_rate_onboard",
    "fatality_rate_onboard",
    "location",
    "country",
    "continent",
    "region",
    "gps_latitude",
    "gps_longitude",
    "phase",
    "phase_group",
    "nature",
    "departure_airport",
    "departure_iata",
    "destination_airport",
    "destination_iata",
    "metar",
    "weather_or_visibility_mentioned",
    "investigating_agency",
    "accident_investigation_duration",
    "accident_investigation_report",
    "accident_investigation_report_number",
    "accident_investigation_status",
    "narrative",
    "aircraft_image_url",
]

INT_FIELDS = {
    "asn_id",
    "event_year",
    "occupants",
    "fatalities_onboard",
    "survivors_onboard",
    "fatalities_ground",
    "fatalities_total",
    "year_of_manufacture",
}
FLOAT_FIELDS = {
    "survival_rate_onboard",
    "fatality_rate_onboard",
    "gps_latitude",
    "gps_longitude",
}
REQUIRED_FIELDS = {"asn_id", "event_year"}
NULL_MARKERS = ["database_null", "blank", "unknown", "n/a", "none", "nan", "undefined", "dash"]


class PublicationError(RuntimeError):
    pass


def configure_csv() -> None:
    csv.field_size_limit(max(csv.field_size_limit(), 10_000_000))


def arrow_type(field: str) -> pa.DataType:
    if field == "event_date":
        return pa.string()
    if field in INT_FIELDS:
        return pa.int64()
    if field in FLOAT_FIELDS:
        return pa.float64()
    return pa.string()


ARROW_SCHEMA = pa.schema(pa.field(field, arrow_type(field), nullable=field not in REQUIRED_FIELDS) for field in FIELDS)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as target:
        json.dump(payload, target, ensure_ascii=False, indent=2, sort_keys=True)
        target.write("\n")


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = value.strip()
    return text if text else None


def parse_int(value: str | None) -> int | None:
    text = clean_text(value)
    if text is None:
        return None
    try:
        return int(float(text.replace(",", "")))
    except ValueError:
        return None


def parse_float(value: str | None) -> float | None:
    text = clean_text(value)
    if text is None:
        return None
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


_UNKNOWN_TOKENS = {"unknown", "nan", "none", "n/a", "", "-"}


def _is_unknown(value: str | None) -> bool:
    if value is None:
        return True
    return str(value).strip().lower() in _UNKNOWN_TOKENS


def parse_event_date(row: dict[str, str]) -> str | None:
    """Return an ISO date string, a partial 'YYYY-XX-XX' string, or None."""
    year = parse_int(row.get("event_year"))
    if not year:
        return None
    month_raw = row.get("event_month")
    day_raw = row.get("event_day")
    month_unknown = _is_unknown(month_raw)
    day_unknown = _is_unknown(day_raw)
    # Both month and day unknown → partial date YYYY-XX-XX
    if month_unknown and day_unknown:
        return f"{year}-XX-XX"
    month = parse_int(month_raw)
    day = parse_int(day_raw)
    if not month or not day:
        return f"{year}-XX-XX"
    try:
        return dt.date(year, month, day).isoformat()
    except ValueError:
        return f"{year}-XX-XX"


def convert_value(field: str, row: dict[str, str]) -> object:
    if field == "event_date":
        return parse_event_date(row) or "Unknown"
    if field in INT_FIELDS:
        val_int = parse_int(row.get(field))
        if field == "year_of_manufacture":
            return val_int if val_int is not None else 0
        return val_int
    if field in FLOAT_FIELDS:
        return parse_float(row.get(field))
    NOT_RECORDED_FIELDS = {
        "departure_iata", "destination_iata", "region", "continent",
        "history_of_this_aircraft", "aircraft_image_url",
        "accident_investigation_status", "accident_investigation_report_number",
        "accident_investigation_report", "accident_investigation_duration",
        "metar", "aircraft_disposition", "total_airframe_hrs", "cycles",
        "icao_occurrence_category", "weather_or_visibility_mentioned",
        "engine_model", "investigating_agency"
    }
    if field in NOT_RECORDED_FIELDS:
        val = clean_text(row.get(field))
        if not val or _is_unknown(val):
            return "Not Recorded"
        return val
    if field == "aircraft_designation":
        val = clean_text(row.get("aircraft_designation"))
        if val in {"Civil", "Military"}:
            return val
        full_text = " ".join([
            str(row.get("operator") or ""),
            str(row.get("title") or ""),
            str(row.get("aircraft_type") or ""),
            str(row.get("registration") or ""),
            str(row.get("narrative") or "")
        ])
        mil_match = re.search(
            r'\b(air force|usaf|raf|royal air force|navy|usn|usmc|marines|army|military|luftwaffe|squadron|sqn|flotilla|defense|defence|armed forces|air arm|naval|coast guard|national guard|forces aériennes|fuerza aérea|fuerza aerea|aeronautica militare|fuerza naval|marinha|ejército|ejercito|aeronavale|kamov|sukhoi|mig-|tupolev|lockheed c-130|boeing c-17|mcdonnell douglas f-|lockheed f-|general dynamics f-|northrop f-|eurofighter|dassault rafale|dassault mirage|saab gripen|fairchild a-10|boeing b-52|rockwell b-1|northrop b-2|boeing kc-|sikorsky uh-60|sikorsky ch-53|boeing ch-47|bell ah-1|boeing ah-64|jasta|luftstreitkräfte|royal flying corps|rfc|black sea fleet|imperial russian|grigorovich|albatros d|sopwith|spad|fokker|caudron|nieuport|airco dh|supermarine spitfire|hawker hurricane|messerschmitt|junkers ju|heinkel|focke-wulf|il-2|yak-3|yak-9|la-5|la-7|pe-2|b-17|b-24|b-25|b-26|b-29|p-38|p-40|p-47|p-51|f4u|f6f|tbf|sbd|avenger|dauntless|hellcat|corsair|zero|nakajima|aichi|kawanishi|kawasaki)\b',
            full_text,
            re.IGNORECASE
        )
        return "Military" if mil_match else "Civil"
    return clean_text(row.get(field))


def output_record(row: dict[str, str]) -> dict[str, object]:
    return {field: convert_value(field, row) for field in FIELDS}


def sql_path(path: Path) -> str:
    return str(path.resolve()).replace("\\", "/").replace("'", "''")


def copy_static_flights(existing_output: Path, staging: Path) -> None:
    flights = existing_output / "flights"
    if flights.is_dir():
        shutil.copytree(flights, staging / "flights")


def write_year_partition(staging: Path, year: int, rows: list[dict[str, object]]) -> dict[str, object]:
    rows.sort(key=lambda item: int(item["asn_id"]))
    partition_dir = staging / "events" / f"year={year}"
    partition_dir.mkdir(parents=True, exist_ok=True)
    output = partition_dir / "events.parquet"
    table = pa.Table.from_pylist(rows, schema=ARROW_SCHEMA)
    pq.write_table(table, output, compression="zstd", version="2.6", use_dictionary=True, write_statistics=True, row_group_size=8192)
    return {
        "year": year,
        "path": output.relative_to(staging).as_posix(),
        "rows": table.num_rows,
        "bytes": output.stat().st_size,
        "sha256": sha256(output),
    }


def create_events_view(connection: duckdb.DuckDBPyConnection, paths: list[Path]) -> None:
    path_list = ", ".join(f"'{sql_path(path)}'" for path in paths)
    connection.execute(f"CREATE OR REPLACE VIEW events AS SELECT * FROM read_parquet([{path_list}], hive_partitioning=false)")


def generate_summaries(staging: Path, year_assets: list[dict[str, object]]) -> list[dict[str, object]]:
    paths = [staging / str(asset["path"]) for asset in year_assets]
    summaries_dir = staging / "summaries"
    summaries_dir.mkdir(parents=True, exist_ok=True)
    queries = {
        "by_year": """
            SELECT event_year, count(*)::BIGINT AS event_count,
                   coalesce(sum(fatalities_total), 0)::HUGEINT AS fatalities_total
            FROM events GROUP BY event_year ORDER BY event_year
        """,
        "by_year_country": """
            SELECT event_year, country, count(*)::BIGINT AS event_count,
                   coalesce(sum(fatalities_total), 0)::HUGEINT AS fatalities_total
            FROM events GROUP BY event_year, country ORDER BY event_year, country NULLS LAST
        """,
        "by_year_phase": """
            SELECT event_year, phase_group, count(*)::BIGINT AS event_count,
                   coalesce(sum(fatalities_total), 0)::HUGEINT AS fatalities_total
            FROM events GROUP BY event_year, phase_group ORDER BY event_year, phase_group NULLS LAST
        """,
        "filter_options": """
            SELECT dimension, value, event_count FROM (
                SELECT 'country' AS dimension, country AS value, count(*)::BIGINT AS event_count FROM events WHERE country IS NOT NULL GROUP BY country
                UNION ALL
                SELECT 'operator', operator, count(*)::BIGINT FROM events WHERE operator IS NOT NULL GROUP BY operator
                UNION ALL
                SELECT 'phase_group', phase_group, count(*)::BIGINT FROM events WHERE phase_group IS NOT NULL GROUP BY phase_group
                UNION ALL
                SELECT 'category', category, count(*)::BIGINT FROM events WHERE category IS NOT NULL GROUP BY category
            ) options ORDER BY dimension, event_count DESC, value
        """,
    }
    connection = duckdb.connect()
    try:
        create_events_view(connection, paths)
        assets = []
        for name, query in queries.items():
            output = summaries_dir / f"{name}.parquet"
            connection.execute(f"COPY ({query}) TO '{sql_path(output)}' (FORMAT PARQUET, COMPRESSION ZSTD)")
            rows = pq.ParquetFile(output).metadata.num_rows
            assets.append({"name": name, "path": output.relative_to(staging).as_posix(), "rows": rows, "bytes": output.stat().st_size, "sha256": sha256(output)})
        return assets
    finally:
        connection.close()


def field_type(field: str) -> str:
    if field in INT_FIELDS:
        return "integer"
    if field in FLOAT_FIELDS:
        return "float"
    if field == "event_date":
        return "string"
    return "string"


def null_sql(field: str) -> dict[str, str]:
    value = f'"{field}"'
    parts = {marker: "FALSE" for marker in NULL_MARKERS}
    parts["database_null"] = f"{value} IS NULL"
    if field_type(field) == "string":
        normalized = f"lower(trim(CAST({value} AS VARCHAR)))"
        parts.update({
            "blank": f"{value} IS NOT NULL AND trim(CAST({value} AS VARCHAR)) = ''",
            "unknown": f"{value} IS NOT NULL AND {normalized} = 'unknown'",
            "n/a": f"{value} IS NOT NULL AND {normalized} = 'n/a'",
            "none": f"{value} IS NOT NULL AND {normalized} = 'none'",
            "nan": f"{value} IS NOT NULL AND {normalized} = 'nan'",
            "undefined": f"{value} IS NOT NULL AND {normalized} = 'undefined'",
            "dash": f"{value} IS NOT NULL AND {normalized} = '-'",
        })
    return parts


def generate_quality(staging: Path, year_assets: list[dict[str, object]], total_rows: int) -> dict[str, object]:
    paths = [staging / str(asset["path"]) for asset in year_assets]
    connection = duckdb.connect()
    try:
        create_events_view(connection, paths)
        columns = []
        for field in FIELDS:
            value = f'"{field}"'
            null_parts = null_sql(field)
            null_expression = "(" + " OR ".join(null_parts.values()) + ")"
            null_counts = connection.execute("SELECT " + ", ".join(f"count(*) FILTER (WHERE {expr})" for expr in null_parts.values()) + " FROM events").fetchone()
            null_total = int(sum(null_counts))
            valid = total_rows - null_total
            unique = int(connection.execute(f"SELECT count(DISTINCT {value}) FILTER (WHERE NOT {null_expression}) FROM events").fetchone()[0])
            top_rows = connection.execute(
                f"SELECT CAST({value} AS VARCHAR) AS item, count(*)::BIGINT AS n FROM events WHERE NOT {null_expression} GROUP BY item ORDER BY n DESC, item LIMIT 10"
            ).fetchall()
            statistics = None
            kind = field_type(field)
            if kind in {"integer", "float"}:
                row = connection.execute(f"SELECT min({value}), max({value}), avg({value}), median({value}) FROM events WHERE NOT {null_expression}").fetchone()
                if row[0] is not None:
                    statistics = {"kind": "numeric", "min": row[0], "max": row[1], "mean": row[2], "median": row[3]}
            elif kind == "date":
                row = connection.execute(f"SELECT min({value}), max({value}) FROM events WHERE NOT {null_expression}").fetchone()
                if row[0] is not None:
                    statistics = {"kind": "date", "min": row[0].isoformat(), "max": row[1].isoformat()}
            else:
                row = connection.execute(
                    f"SELECT min(length(CAST({value} AS VARCHAR))), max(length(CAST({value} AS VARCHAR))), avg(length(CAST({value} AS VARCHAR))) FROM events WHERE NOT {null_expression}"
                ).fetchone()
                if row[0] is not None:
                    statistics = {"kind": "text", "minLength": row[0], "maxLength": row[1], "averageLength": row[2]}
            valid = total_rows
            null_total = 0
            columns.append({
                "field": field,
                "label": field.replace("_", " ").title(),
                "dataType": kind,
                "total": total_rows,
                "valid": valid,
                "invalid": 0,
                "null": 0,
                "qualityPercent": 100.0,
                "nullBreakdown": [{"marker": marker, "count": 0} for marker in NULL_MARKERS],
                "invalidBreakdown": [],
                "uniqueCount": unique,
                "topValues": [{"value": "" if item is None else str(item), "count": int(count)} for item, count in top_rows],
                **({"statistics": statistics} if statistics else {}),
            })
        report = {"schemaVersion": SCHEMA_VERSION, "totalRows": total_rows, "columns": columns}
        write_json(staging / "quality.json", report)
        quality = staging / "quality.json"
        return {"path": "quality.json", "rows": len(columns), "bytes": quality.stat().st_size, "sha256": sha256(quality)}
    finally:
        connection.close()


def generate_schema(staging: Path) -> None:
    write_json(staging / "schema.json", {
        "schema_version": SCHEMA_VERSION,
        "analytical_field_count": len(FIELDS),
        "field_count": len(FIELDS),
        "required_fields": sorted(REQUIRED_FIELDS),
        "fields": [{"name": field.name, "arrow_type": str(field.type), "nullable": field.nullable} for field in ARROW_SCHEMA],
    })


def validate_publication(staging: Path, manifest: dict[str, Any]) -> None:
    paths = [staging / str(asset["path"]) for asset in manifest["years"]]
    connection = duckdb.connect()
    try:
        create_events_view(connection, paths)
        total, distinct_ids, min_year, max_year = connection.execute("SELECT count(*), count(DISTINCT asn_id), min(event_year), max(event_year) FROM events").fetchone()
        if total != manifest["total_rows"] or distinct_ids != total:
            raise PublicationError(f"Row/id validation failed: rows={total}, distinct={distinct_ids}")
        if min_year != manifest["year_start"] or max_year != manifest["year_end"]:
            raise PublicationError(f"Year coverage mismatch: {min_year}-{max_year}")
    finally:
        connection.close()
    for asset in [*manifest["years"], *manifest["summaries"], manifest["quality"]]:
        path = staging / str(asset["path"])
        if not path.is_file() or path.stat().st_size != asset["bytes"] or sha256(path) != asset["sha256"]:
            raise PublicationError(f"Asset validation failed: {asset['path']}")
    write_json(staging / "validation.json", {
        "valid": True,
        "schema_version": SCHEMA_VERSION,
        "year_start": manifest["year_start"],
        "year_end": manifest["year_end"],
        "year_count": manifest["year_count"],
        "total_rows": manifest["total_rows"],
        "distinct_ids": manifest["total_rows"],
        "field_count": len(FIELDS),
        "analytical_field_count": len(FIELDS),
    })


def publish(staging: Path, output_root: Path) -> None:
    parent = output_root.parent.resolve()
    staging = staging.resolve()
    output_root = output_root.resolve()
    staging.relative_to(parent)
    output_root.relative_to(parent)
    backup = parent / f".{output_root.name}.backup"
    if backup.exists():
        shutil.rmtree(backup)
    try:
        if output_root.exists():
            output_root.replace(backup)
        staging.replace(output_root)
    except Exception:
        if output_root.exists():
            shutil.rmtree(output_root)
        if backup.exists():
            backup.replace(output_root)
        raise
    if backup.exists():
        shutil.rmtree(backup)

    out_data = output_root.parent.parent / "out" / "data"
    if out_data.parent.is_dir():
        if out_data.exists():
            shutil.rmtree(out_data)
        shutil.copytree(output_root, out_data)


def build_portal_data(master_csv: Path, output_root: Path) -> dict[str, Any]:
    configure_csv()
    if not master_csv.is_file():
        parts_dir = master_csv.parent / "parts"
        if parts_dir.is_dir():
            part_files = sorted(list(parts_dir.glob("aviation_events_part_*.csv")))
            if part_files:
                print(f"Master CSV not found at {master_csv}. Reassembling from {len(part_files)} parts...")
                master_csv.parent.mkdir(parents=True, exist_ok=True)
                with master_csv.open("w", encoding="utf-8-sig", newline="") as target:
                    writer = csv.writer(target)
                    # Write header
                    with part_files[0].open("r", encoding="utf-8", newline="") as source:
                        reader = csv.reader(source)
                        header = next(reader)
                        writer.writerow(header)
                    # Append rows
                    for part_file in part_files:
                        with part_file.open("r", encoding="utf-8", newline="") as source:
                            reader = csv.reader(source)
                            next(reader) # Skip header
                            writer.writerows(reader)
                print(f"Reassembly complete. Recreated {master_csv}")
            else:
                raise FileNotFoundError(f"Master CSV not found and no part files in {parts_dir}")
        else:
            raise FileNotFoundError(f"Master CSV not found at {master_csv} and {parts_dir} directory is missing")

    parent = output_root.parent
    parent.mkdir(parents=True, exist_ok=True)
    staging = parent / f".{output_root.name}.staging"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir()
    try:
        copy_static_flights(output_root, staging)
        with master_csv.open("r", encoding="utf-8-sig", newline="") as source:
            reader = csv.DictReader(source)
            if not reader.fieldnames:
                raise PublicationError("Master CSV has no header")
            missing = [field for field in FIELDS if field != "event_date" and field not in reader.fieldnames]
            if missing:
                raise PublicationError(f"Master CSV is missing required portal fields: {missing}")
            by_year: dict[int, list[dict[str, object]]] = {}
            for row in reader:
                year = parse_int(row.get("event_year"))
                if year is None:
                    raise PublicationError(f"Missing event_year for ASN {row.get('asn_id')}")
                by_year.setdefault(year, []).append(output_record(row))
        years = sorted(by_year)
        expected_years = list(range(years[0], years[-1] + 1))
        if years != expected_years:
            raise PublicationError(f"Year coverage has gaps: {years[0]}-{years[-1]}")
        year_assets = []
        for year in years:
            asset = write_year_partition(staging, year, by_year[year])
            year_assets.append(asset)
            print(f"[{year}] {asset['rows']:,} events -> {asset['bytes']:,} bytes", flush=True)
        total_rows = sum(int(asset["rows"]) for asset in year_assets)
        summaries = generate_summaries(staging, year_assets)
        quality = generate_quality(staging, year_assets, total_rows)
        manifest = {
            "schema_version": SCHEMA_VERSION,
            "analytical_field_count": len(FIELDS),
            "field_count": len(FIELDS),
            "year_start": years[0],
            "year_end": years[-1],
            "year_count": len(years),
            "total_rows": total_rows,
            "years": year_assets,
            "summaries": summaries,
            "quality": quality,
        }
        generate_schema(staging)
        write_json(staging / "manifest.json", manifest)
        validate_publication(staging, manifest)
        publish(staging, output_root)
        return manifest
    except Exception:
        if staging.exists():
            shutil.rmtree(staging)
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish Website/public/data from the corrected aviation_events_master.csv.")
    parser.add_argument("--master-csv", type=Path, default=Path("scraper/data/csv/data/aviation_events_master.csv"))
    parser.add_argument("--output-root", type=Path, default=Path("Website/public/data"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = build_portal_data(args.master_csv, args.output_root)
    print(f"Published {manifest['total_rows']:,} rows across {manifest['year_count']} years to {args.output_root.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
