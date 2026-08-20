from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PARTS_DIR = PROJECT_ROOT / "scraper" / "data" / "csv" / "data" / "parts"
DEFAULT_REPORT = PROJECT_ROOT / "scraper" / "data" / "csv" / "data" / "case_normalization_report.json"

# These fields contain prose, source documents, weather reports, or URLs where
# changing arbitrary text case is undesirable. Exact whole-cell missing-value
# sentinels are still normalized in every field.
GENERAL_NORMALIZATION_EXCLUSIONS = {
    "accident_investigation_report",
    "aircraft_image_url",
    "history_of_this_aircraft",
    "metar",
    "narrative",
    "title",
}
SENTINEL_CANONICAL = {
    "non recorded": "Non Recorded",
    "not recorded": "Not Recorded",
}


def configure_csv() -> None:
    csv.field_size_limit(10_000_000)


def part_files(parts_dir: Path) -> list[Path]:
    files = sorted(parts_dir.glob("aviation_events_part_*.csv"))
    if len(files) != 17:
        raise RuntimeError(f"Expected 17 part files in {parts_dir}, found {len(files)}")
    return files


def choose_canonical(variants: Counter[str], lowercase_key: str) -> str:
    sentinel = SENTINEL_CANONICAL.get(lowercase_key)
    if sentinel:
        return sentinel
    return sorted(variants.items(), key=lambda item: (-item[1], item[0]))[0][0]


def collect_variants(
    files: Iterable[Path],
) -> tuple[list[str], dict[str, dict[str, Counter[str]]], int]:
    fields: list[str] | None = None
    variants: dict[str, dict[str, Counter[str]]] = {}
    total_rows = 0

    for source_path in files:
        with source_path.open("r", encoding="utf-8-sig", newline="") as source:
            reader = csv.DictReader(source)
            if not reader.fieldnames:
                raise RuntimeError(f"{source_path} has no CSV header")
            if fields is None:
                fields = list(reader.fieldnames)
                variants = {
                    field: defaultdict(Counter)
                    for field in fields
                    if field not in GENERAL_NORMALIZATION_EXCLUSIONS
                }
            elif list(reader.fieldnames) != fields:
                raise RuntimeError(f"{source_path} has a different CSV header")

            for row in reader:
                total_rows += 1
                for field, groups in variants.items():
                    value = row.get(field) or ""
                    if value:
                        groups[value.lower()][value] += 1

    if fields is None:
        raise RuntimeError("No CSV files were read")
    return fields, variants, total_rows


def build_replacements(
    fields: list[str],
    variants: dict[str, dict[str, Counter[str]]],
) -> tuple[dict[str, dict[str, str]], dict[str, object]]:
    replacements: dict[str, dict[str, str]] = {field: {} for field in fields}
    collision_details: dict[str, list[dict[str, object]]] = defaultdict(list)
    field_changed_cells: Counter[str] = Counter()
    sentinel_changed_cells: Counter[str] = Counter()

    for field, groups in variants.items():
        for lowercase_key, exact_variants in groups.items():
            if len(exact_variants) <= 1:
                continue
            canonical = choose_canonical(exact_variants, lowercase_key)
            changed = 0
            for exact, count in exact_variants.items():
                if exact != canonical:
                    replacements[field][exact] = canonical
                    changed += count
            field_changed_cells[field] += changed
            collision_details[field].append(
                {
                    "lowercase_key": lowercase_key,
                    "canonical": canonical,
                    "rows": sum(exact_variants.values()),
                    "changed_cells": changed,
                    "variants": dict(exact_variants.most_common()),
                }
            )

    # Exact whole-cell sentinels are safe to normalize even in excluded prose
    # fields. Count them during the application pass because excluded fields
    # were intentionally not retained in the potentially large variant index.
    for field in fields:
        replacements.setdefault(field, {})

    for details in collision_details.values():
        details.sort(
            key=lambda item: (
                -int(item["changed_cells"]),
                -int(item["rows"]),
                str(item["lowercase_key"]),
            )
        )

    return replacements, {
        "field_changed_cells_from_case_collisions": dict(field_changed_cells.most_common()),
        "collision_groups_by_field": {
            field: len(details)
            for field, details in sorted(collision_details.items())
        },
        "collision_details": dict(collision_details),
        "sentinel_changed_cells": sentinel_changed_cells,
    }


def normalized_value(
    field: str,
    value: str,
    replacements: dict[str, dict[str, str]],
) -> tuple[str, str | None]:
    sentinel = SENTINEL_CANONICAL.get(value.lower())
    if sentinel and value != sentinel:
        return sentinel, "sentinel"
    replacement = replacements.get(field, {}).get(value)
    if replacement is not None:
        return replacement, "case_collision"
    return value, None


def analyze_or_stage(
    files: Iterable[Path],
    fields: list[str],
    replacements: dict[str, dict[str, str]],
    staging_dir: Path | None,
) -> dict[str, object]:
    changed_by_field: Counter[str] = Counter()
    sentinel_changes_by_field: Counter[str] = Counter()
    examples: dict[str, list[dict[str, str]]] = defaultdict(list)
    file_rows: dict[str, int] = {}
    total_rows = 0

    if staging_dir:
        staging_dir.mkdir(parents=True, exist_ok=False)

    for source_path in files:
        row_count = 0
        target = None
        target_path = staging_dir / source_path.name if staging_dir else None
        try:
            with source_path.open("r", encoding="utf-8-sig", newline="") as source:
                reader = csv.DictReader(source)
                if list(reader.fieldnames or ()) != fields:
                    raise RuntimeError(f"{source_path} has a different CSV header")
                if target_path:
                    target = target_path.open("w", encoding="utf-8", newline="")
                    writer = csv.DictWriter(target, fieldnames=fields)
                    writer.writeheader()
                else:
                    writer = None

                for row in reader:
                    row_count += 1
                    total_rows += 1
                    for field in fields:
                        original = row.get(field) or ""
                        normalized, method = normalized_value(field, original, replacements)
                        if method:
                            row[field] = normalized
                            changed_by_field[field] += 1
                            if method == "sentinel":
                                sentinel_changes_by_field[field] += 1
                            if len(examples[field]) < 20:
                                examples[field].append(
                                    {
                                        "asn_id": row.get("asn_id", ""),
                                        "before": original,
                                        "after": normalized,
                                        "method": method,
                                    }
                                )
                    if writer:
                        writer.writerow(row)
        finally:
            if target:
                target.close()
        file_rows[source_path.name] = row_count

    return {
        "total_rows": total_rows,
        "changed_cells": sum(changed_by_field.values()),
        "changed_cells_by_field": dict(changed_by_field.most_common()),
        "sentinel_changes": sum(sentinel_changes_by_field.values()),
        "sentinel_changes_by_field": dict(sentinel_changes_by_field.most_common()),
        "examples": dict(examples),
        "file_rows": file_rows,
    }


def publish_staged(files: list[Path], staging_dir: Path) -> None:
    for source_path in files:
        staged_path = staging_dir / source_path.name
        if not staged_path.is_file():
            raise RuntimeError(f"Missing staged file: {staged_path}")
    for source_path in files:
        os.replace(staging_dir / source_path.name, source_path)
    staging_dir.rmdir()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize case-only value variants across all aviation event CSV parts."
    )
    parser.add_argument("--parts-dir", type=Path, default=DEFAULT_PARTS_DIR)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true", help="Write normalized values to all 17 part files.")
    return parser.parse_args()


def main() -> int:
    configure_csv()
    args = parse_args()
    files = part_files(args.parts_dir)
    fields, variants, profiled_rows = collect_variants(files)
    replacements, profile = build_replacements(fields, variants)
    staging_dir = args.parts_dir / ".case_normalization_staging" if args.apply else None
    if staging_dir and staging_dir.exists():
        shutil.rmtree(staging_dir)

    try:
        report = analyze_or_stage(files, fields, replacements, staging_dir)
        if report["total_rows"] != profiled_rows:
            raise RuntimeError(
                f"Profile/apply row mismatch: {profiled_rows} != {report['total_rows']}"
            )
        report.update(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "applied": bool(args.apply),
                "fields": fields,
                "general_normalization_exclusions": sorted(GENERAL_NORMALIZATION_EXCLUSIONS),
                "sentinel_canonical": SENTINEL_CANONICAL,
                **profile,
            }
        )
        if args.apply and staging_dir:
            publish_staged(files, staging_dir)
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            json.dumps(
                {
                    "total_rows": report["total_rows"],
                    "changed_cells": report["changed_cells"],
                    "sentinel_changes": report["sentinel_changes"],
                    "changed_cells_by_field": report["changed_cells_by_field"],
                    "applied": report["applied"],
                },
                ensure_ascii=True,
            )
        )
        return 0
    except Exception:
        if staging_dir and staging_dir.exists():
            shutil.rmtree(staging_dir)
        raise


if __name__ == "__main__":
    raise SystemExit(main())
