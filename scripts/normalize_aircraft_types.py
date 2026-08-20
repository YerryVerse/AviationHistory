from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PARTS_DIR = PROJECT_ROOT / "scraper" / "data" / "csv" / "data" / "parts"
DEFAULT_DICTIONARY = PROJECT_ROOT / "scraper" / "data" / "csv" / "dictionaries" / "aircraft_dictionary.csv"
DEFAULT_REPORT = PROJECT_ROOT / "scraper" / "data" / "csv" / "data" / "aircraft_type_normalization_report.json"

CANONICAL_TYPES = (
    "Propeller",
    "Jet",
    "Helicopter",
    "Glider",
    "UAV",
    "Balloon",
    "Gyroplane",
    "Paramotor",
    "Airship",
    "Tiltrotor",
    "Powered Parachute",
    "Paraglider",
)

DIRECT_TYPE_MAP = {
    value.casefold(): value for value in CANONICAL_TYPES
}
DIRECT_TYPE_MAP.update(
    {
        "turboprop": "Propeller",
        "seaplane": "Propeller",
    }
)

EMPTY_MARKERS = {
    "",
    "-",
    "?",
    "n/a",
    "na",
    "none",
    "not available",
    "not recorded",
    "not reported",
    "null",
    "unknown",
    "various",
    "mixed",
}

STRUCTURED_FIELDS = (
    "aircraft_type",
    "aircraft_manufacturer",
    "aircraft_name",
    "aircraft_model",
    "aircraft_variant",
    "aircraft_common_name",
    "engine_model",
    "title",
)

DICTIONARY_ALIAS_FIELDS = (
    "Raw aircraft",
    "Name",
    "Model",
    "Common name",
)

KEYWORD_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Powered Parachute", (r"\bpowered parachute\b", r"\bparaplane\b")),
    ("Paramotor", (r"\bparamotor\b", r"\bpowered paraglider\b")),
    ("Paraglider", (r"\bparaglider\b", r"\bpara[- ]glider\b")),
    ("Tiltrotor", (r"\btilt[- ]?rotor\b", r"\bconvertiplane\b", r"\bv[- ]?22\b", r"\baw[- ]?609\b", r"\bosprey\b")),
    ("Gyroplane", (r"\bgyroplane\b", r"\bgyrocopter\b", r"\bautogiro\b", r"\bautogyro\b", r"\bsport copter\b", r"\btag titanium explorer\b", r"\blira raf\b")),
    ("Airship", (r"\bairship\b", r"\bdirigible\b", r"\bzeppelin\b", r"\bblimp\b")),
    ("Balloon", (r"\bhot air balloon\b", r"\bgas balloon\b", r"\bballoon\b")),
    ("UAV", (r"\bunmanned\b", r"\buav\b", r"\bucav\b", r"\brpas\b", r"\bdrone\b", r"\bremotely piloted\b", r"\b(?:mq|rq)-?\d+\b", r"\breaper\b", r"\bpredator\b", r"\bt-drones\b", r"\bskymagic\b", r"\bdrishti-?10\b", r"\bhermes 900\b", r"\bch-?95\b")),
    ("Helicopter", (r"\bhelicopters?\b", r"\brotorcraft\b", r"\bgyrodyne\b", r"\bquadcop(?:ter)?\b", r"\bairbus helicopters\b", r"\bguimbal cabri\b", r"\bhelisport ch-?77\b", r"\bhh-?60\w*\b", r"\bblack ?hawk\b")),
    ("Glider", (r"\bglider\b", r"\bsailplane\b", r"\bhang glider\b", r"\bgrob g-?103\b", r"\bpw-?5\b", r"\bb[oö]lkow phoebus\b", r"\bschleicher asw-?\d+\b")),
    ("Jet", (r"\bjet aircraft\b", r"\bjetliner\b", r"\bturbojet\b", r"\bturbofan\b", r"\bjet[- ]powered\b", r"\bevtol jet\b", r"\bboeing 7\d{2}\b", r"\bairbus a[234]\d{2}\b", r"\bgulfstream g\d+\b", r"\bxian y-?20\b", r"\bf-?16(?:[a-z]|\b)", r"\b(?:cfm|cfmi) cfm\d+\b", r"\bge cf6\b", r"\bge90\b")),
    ("Propeller", (r"\bturboprop\b", r"\bpropeller\b", r"\bpiston[- ]engine\b", r"\breciprocating engine\b", r"\bseaplane\b", r"\bultralight\b")),
)

COMPILED_KEYWORD_RULES = tuple(
    (aircraft_type, tuple(re.compile(pattern, re.IGNORECASE) for pattern in patterns))
    for aircraft_type, patterns in KEYWORD_RULES
)

AIRFRAME_OVERRIDE_RULES: tuple[tuple[str, tuple[re.Pattern[str], ...]], ...] = (
    (
        "Propeller",
        tuple(
            re.compile(pattern, re.IGNORECASE)
            for pattern in (
                r"\bbellanca\b",
                r"\bcanadair cl-?415\b",
                r"\btupolev tu-?95\b",
                r"\bmicroleve mxl\b",
            )
        ),
    ),
)


def configure_csv() -> None:
    csv.field_size_limit(10_000_000)


def normalize_key(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).replace("\u00a0", " ")
    text = text.casefold().strip()
    text = re.sub(r"[_/]+", " ", text)
    text = re.sub(r"[^\w.+-]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_value(value: object) -> str:
    text = str(value or "").strip()
    return "" if normalize_key(text) in EMPTY_MARKERS else text


def keyword_type(text: str) -> str | None:
    if not text:
        return None
    for aircraft_type, patterns in COMPILED_KEYWORD_RULES:
        if any(pattern.search(text) for pattern in patterns):
            return aircraft_type
    return None


def airframe_override_type(text: str) -> str | None:
    for aircraft_type, patterns in AIRFRAME_OVERRIDE_RULES:
        if any(pattern.search(text) for pattern in patterns):
            return aircraft_type
    return None


def normalized_dictionary_type(raw_type: object, evidence: str = "") -> str | None:
    key = normalize_key(raw_type)
    if not key or key in EMPTY_MARKERS:
        return None
    if key in DIRECT_TYPE_MAP:
        return DIRECT_TYPE_MAP[key]
    if key == "ultralight":
        return keyword_type(evidence) or "Propeller"
    if key == "evtol":
        return "Tiltrotor" if keyword_type(evidence) == "Tiltrotor" else "Helicopter"
    return None


def dictionary_aliases(row: dict[str, str]) -> set[str]:
    manufacturer = clean_value(row.get("Manufacturer"))
    name = clean_value(row.get("Name"))
    model = clean_value(row.get("Model"))
    common_name = clean_value(row.get("Common name"))
    aliases = {
        clean_value(row.get(field))
        for field in DICTIONARY_ALIAS_FIELDS
    }
    aliases.update(
        {
            " ".join(part for part in (manufacturer, name) if part),
            " ".join(part for part in (manufacturer, model) if part),
            " ".join(part for part in (manufacturer, name, model) if part),
            " ".join(part for part in (name, model) if part),
            " ".join(part for part in (manufacturer, common_name) if part),
        }
    )
    return {normalize_key(alias) for alias in aliases if clean_value(alias)}


def load_dictionary(path: Path) -> tuple[dict[str, str], dict[str, str], dict[str, int]]:
    raw_targets: dict[str, set[str]] = defaultdict(set)
    alias_targets: dict[str, set[str]] = defaultdict(set)
    type_counts: Counter[str] = Counter()

    with path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        for row in reader:
            evidence = " ".join(clean_value(row.get(field)) for field in row)
            evidence_keyword = keyword_type(evidence)
            target = airframe_override_type(evidence)
            if not target and evidence_keyword and evidence_keyword not in {"Propeller", "Jet"}:
                target = evidence_keyword
            if not target:
                target = normalized_dictionary_type(row.get("Type"), evidence)
            if not target:
                target = evidence_keyword
            if not target:
                continue
            type_counts[target] += 1
            raw_key = normalize_key(row.get("Raw aircraft"))
            if raw_key:
                raw_targets[raw_key].add(target)
            for alias in dictionary_aliases(row):
                alias_targets[alias].add(target)

    raw_lookup = {
        alias: next(iter(targets))
        for alias, targets in raw_targets.items()
        if len(targets) == 1
    }
    alias_lookup = {
        alias: next(iter(targets))
        for alias, targets in alias_targets.items()
        if len(targets) == 1
    }
    return raw_lookup, alias_lookup, dict(type_counts)


def event_aliases(row: dict[str, str]) -> list[str]:
    manufacturer = clean_value(row.get("aircraft_manufacturer"))
    name = clean_value(row.get("aircraft_name"))
    model = clean_value(row.get("aircraft_model"))
    common_name = clean_value(row.get("aircraft_common_name"))
    raw_type = clean_value(row.get("aircraft_type"))
    candidates = (
        raw_type,
        " ".join(part for part in (manufacturer, name, model) if part),
        " ".join(part for part in (manufacturer, model) if part),
        " ".join(part for part in (manufacturer, name) if part),
        " ".join(part for part in (name, model) if part),
        model,
        name,
        common_name,
        " ".join(part for part in (manufacturer, common_name) if part),
    )
    seen: set[str] = set()
    result: list[str] = []
    for candidate in candidates:
        key = normalize_key(candidate)
        if key and key not in EMPTY_MARKERS and key not in seen:
            seen.add(key)
            result.append(key)
    return result


def classify_event(
    row: dict[str, str],
    raw_lookup: dict[str, str],
    alias_lookup: dict[str, str],
) -> tuple[str, str]:
    structured_text = " ".join(clean_value(row.get(field)) for field in STRUCTURED_FIELDS)
    current_key = normalize_key(row.get("aircraft_type"))
    structured = keyword_type(structured_text)
    airframe_override = airframe_override_type(structured_text)

    if airframe_override:
        current_direct = DIRECT_TYPE_MAP.get(current_key)
        if current_direct == airframe_override:
            return airframe_override, "retained"
        return airframe_override, "structured_field_override"

    # High-specificity specialty classes override an existing generic or
    # erroneous dictionary label (for example MQ-9 recorded as Propeller).
    if structured and structured not in {"Propeller", "Jet"}:
        current_direct = DIRECT_TYPE_MAP.get(current_key)
        if current_direct == structured:
            return structured, "retained"
        return structured, "structured_field_override"

    current = normalized_dictionary_type(row.get("aircraft_type"), structured_text)
    if current:
        method = "retained" if current_key in {value.casefold() for value in CANONICAL_TYPES} else "collapsed_minor_type"
        return current, method

    if current_key in raw_lookup:
        return raw_lookup[current_key], "dictionary_raw_aircraft"

    for alias in event_aliases(row):
        target = alias_lookup.get(alias)
        if target:
            return target, "dictionary_structured_alias"

    if structured:
        return structured, "structured_field_keywords"

    narrative_text = clean_value(row.get("narrative"))
    narrative = keyword_type(narrative_text)
    if narrative:
        return narrative, "narrative_keywords"

    if (
        not clean_value(row.get("aircraft_type"))
        and "passenger" in narrative_text.casefold()
        and "flight from" in narrative_text.casefold()
        and len(re.findall(r"\([A-Z]{3}\)", narrative_text)) >= 2
    ):
        return "Jet", "scheduled_route_context"

    if normalize_key(row.get("registration")) == "n75re":
        return "Propeller", "registration_reference"

    # Aviation records without enough evidence are overwhelmingly fixed-wing
    # propeller aircraft in this dataset. This final fallback prevents blanks
    # while remaining explicit and auditable in the generated report.
    return "Propeller", "fallback_propeller"


def part_files(parts_dir: Path) -> list[Path]:
    files = sorted(parts_dir.glob("aviation_events_part_*.csv"))
    if len(files) != 17:
        raise RuntimeError(f"Expected 17 part files in {parts_dir}, found {len(files)}")
    return files


def analyze_or_stage(
    files: Iterable[Path],
    raw_lookup: dict[str, str],
    alias_lookup: dict[str, str],
    staging_dir: Path | None,
) -> dict[str, object]:
    before_types: Counter[str] = Counter()
    after_types: Counter[str] = Counter()
    methods: Counter[str] = Counter()
    changed_original_types: Counter[str] = Counter()
    changed_transitions: Counter[str] = Counter()
    method_examples: dict[str, list[dict[str, str]]] = defaultdict(list)
    dictionary_narrative_conflicts: Counter[str] = Counter()
    conflict_examples: list[dict[str, str]] = []
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
                if not reader.fieldnames or "aircraft_type" not in reader.fieldnames:
                    raise RuntimeError(f"{source_path} does not contain aircraft_type")
                if target_path:
                    target = target_path.open("w", encoding="utf-8", newline="")
                    writer = csv.DictWriter(target, fieldnames=reader.fieldnames)
                    writer.writeheader()
                else:
                    writer = None

                for row in reader:
                    row_count += 1
                    total_rows += 1
                    original = clean_value(row.get("aircraft_type")) or "<blank>"
                    normalized, method = classify_event(row, raw_lookup, alias_lookup)
                    if method.startswith("dictionary_"):
                        narrative_signal = keyword_type(clean_value(row.get("narrative")))
                        if narrative_signal and narrative_signal != normalized:
                            conflict_key = f"{normalized} -> {narrative_signal}"
                            dictionary_narrative_conflicts[conflict_key] += 1
                            if len(conflict_examples) < 100:
                                conflict_examples.append(
                                    {
                                        "asn_id": row.get("asn_id", ""),
                                        "before": original,
                                        "dictionary_type": normalized,
                                        "narrative_signal": narrative_signal,
                                        "narrative_excerpt": clean_value(row.get("narrative"))[:500],
                                    }
                                )
                    before_types[original] += 1
                    after_types[normalized] += 1
                    methods[method] += 1
                    if original != normalized:
                        changed_original_types[original] += 1
                        changed_transitions[f"{original} -> {normalized}"] += 1
                    example_limit = 100 if method == "fallback_propeller" else 12
                    if method != "retained" and len(method_examples[method]) < example_limit:
                        method_examples[method].append(
                            {
                                "asn_id": row.get("asn_id", ""),
                                "before": original,
                                "after": normalized,
                                "title": row.get("title", ""),
                                "aircraft_manufacturer": row.get("aircraft_manufacturer", ""),
                                "aircraft_name": row.get("aircraft_name", ""),
                                "aircraft_model": row.get("aircraft_model", ""),
                                "aircraft_common_name": row.get("aircraft_common_name", ""),
                                "engine_model": row.get("engine_model", ""),
                                "narrative_excerpt": clean_value(row.get("narrative"))[:500],
                            }
                        )
                    if writer:
                        row["aircraft_type"] = normalized
                        writer.writerow(row)
        finally:
            if target:
                target.close()
        file_rows[source_path.name] = row_count

    return {
        "total_rows": total_rows,
        "before_distinct_types": len(before_types),
        "after_distinct_types": len(after_types),
        "before_blank_rows": before_types.get("<blank>", 0),
        "after_blank_rows": 0,
        "after_type_counts": dict(after_types.most_common()),
        "resolution_methods": dict(methods.most_common()),
        "changed_rows": sum(changed_original_types.values()),
        "most_common_changed_inputs": dict(changed_original_types.most_common(50)),
        "changed_transitions": dict(changed_transitions.most_common()),
        "method_examples": dict(method_examples),
        "dictionary_narrative_conflicts": dict(dictionary_narrative_conflicts.most_common()),
        "dictionary_narrative_conflict_examples": conflict_examples,
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
    parser = argparse.ArgumentParser(description="Normalize aircraft_type across all aviation event CSV parts.")
    parser.add_argument("--parts-dir", type=Path, default=DEFAULT_PARTS_DIR)
    parser.add_argument("--dictionary", type=Path, default=DEFAULT_DICTIONARY)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true", help="Write normalized aircraft_type values to all 17 part files.")
    return parser.parse_args()


def main() -> int:
    configure_csv()
    args = parse_args()
    files = part_files(args.parts_dir)
    raw_lookup, alias_lookup, dictionary_type_counts = load_dictionary(args.dictionary)
    staging_dir = args.parts_dir / ".aircraft_type_staging" if args.apply else None
    if staging_dir and staging_dir.exists():
        shutil.rmtree(staging_dir)

    try:
        report = analyze_or_stage(files, raw_lookup, alias_lookup, staging_dir)
        report.update(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "applied": bool(args.apply),
                "canonical_types": list(CANONICAL_TYPES),
                "dictionary_type_counts_after_grouping": dictionary_type_counts,
                "dictionary_raw_keys": len(raw_lookup),
                "dictionary_unambiguous_aliases": len(alias_lookup),
            }
        )
        if args.apply and staging_dir:
            publish_staged(files, staging_dir)
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True))
        return 0
    except Exception:
        if staging_dir and staging_dir.exists():
            shutil.rmtree(staging_dir)
        raise


if __name__ == "__main__":
    raise SystemExit(main())
