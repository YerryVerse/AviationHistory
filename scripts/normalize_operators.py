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
DEFAULT_DICTIONARY = PROJECT_ROOT / "scraper" / "data" / "csv" / "dictionaries" / "operator_dictionary.csv"
DEFAULT_REPORT = PROJECT_ROOT / "scraper" / "data" / "csv" / "data" / "operator_normalization_report.json"

FALLBACK_OPERATOR = "Non Recorded"
GENERIC_OPERATOR_KEYS = {
    "",
    "-",
    "?",
    "commercial",
    "military",
    "n a",
    "na",
    "non commercial",
    "none",
    "not available",
    "not recorded",
    "not reported",
    "null",
    "private",
    "unknown",
    "unrecorded",
    "unspecified",
}
GENERIC_ENTITY_KEYS = {
    "aero",
    "air service",
    "aircraft operator",
    "airline",
    "aviation",
    "aviation training",
    "commercial operator",
    "company",
    "fishing company",
    "flight school",
    "flight training",
    "flying club",
    "government",
    "helicopter operator",
    "helicopters",
    "military operator",
    "operator",
    "private company",
}
INVALID_REGISTRATION_KEYS = {
    "",
    "-",
    "?",
    "n a",
    "na",
    "none",
    "not recorded",
    "not reported",
    "null",
    "unknown",
    "unassigned",
    "unregistered",
    "various",
}
ORGANIZATION_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\b(?:airlines?|airways?|aviation|aero|a[eé]rien|aeron[aá]utica|aeroclub|aero club)\b",
        r"\b(?:air force|air service|air corps|air arm|army|navy|marine corps|coast guard)\b",
        r"\b(?:force|forces|militaire|militare|militar|luftwaffe|luftstreitkr[aä]fte)\b",
        r"\b(?:fuerza a[eé]rea|for[cç]a a[eé]rea|arm[eé]e de l['’]air|flyvev[aå]bnet)\b",
        r"\b(?:police|sheriff|patrol|customs|government|ministry|department|bureau|authority|agency)\b",
        r"\b(?:fire|rescue|ambulance|medical|forestry|survey|inspection)\b",
        r"\b(?:flight|flying|helicopters?|charter|cargo|transport|logistics|school|academy|club)\b",
        r"\b(?:company|corporation|corp|incorporated|limited|holdings|foundation|university)\b",
        r"\b(?:co|inc|ltd|llc|plc|gmbh|ag|sa|sas|spa|bv|nv|a/s|pty)\b",
        r"\b(?:squadron|sqn|wing|regiment|brigade|battalion|command|unit)\b",
    )
)
OPERATOR_CUE_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\boperated by\s+([^\n.;]{2,160})",
        r"\boperator(?: was| is|:)\s+([^\n.;]{2,160})",
        r"\bowned by\s+([^\n.;]{2,160})",
        r"\bregistered to\s+([^\n.;]{2,160})",
        r"\bbelonged to\s+([^\n.;]{2,160})",
    )
)
LEADING_ENTITY_WORDS = {
    "a",
    "an",
    "aircraft",
    "airplane",
    "helicopter",
    "the",
}
TRAILING_CLAUSE_WORDS = {
    "and",
    "as",
    "at",
    "based",
    "before",
    "during",
    "from",
    "in",
    "located",
    "near",
    "on",
    "operating",
    "under",
    "when",
    "which",
    "while",
    "with",
}
MAX_IDENTITY_YEAR_GAP = 10


def configure_csv() -> None:
    csv.field_size_limit(10_000_000)


def normalize_text(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).replace("\u00a0", " ")
    text = text.casefold().strip()
    text = re.sub(r"[^a-z0-9\u00c0-\u024f]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_value(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def generic_operator(value: object) -> bool:
    return normalize_text(value) in GENERIC_OPERATOR_KEYS


def looks_named_organization(value: object) -> bool:
    text = clean_value(value)
    if generic_operator(text) or normalize_text(text) in GENERIC_ENTITY_KEYS:
        return False
    return any(pattern.search(text) for pattern in ORGANIZATION_PATTERNS)


def load_operator_dictionary(path: Path) -> tuple[dict[str, str], dict[str, int]]:
    raw_targets: dict[str, set[str]] = defaultdict(set)
    canonical_frequency: Counter[str] = Counter()
    with path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        for row in reader:
            raw = normalize_text(row.get("raw_operator"))
            canonical = clean_value(row.get("operator"))
            if not raw or not canonical:
                continue
            raw_targets[raw].add(canonical)
            try:
                canonical_frequency[canonical] += int(row.get("frequency") or 0)
            except ValueError:
                pass
            raw_targets[normalize_text(canonical)].add(canonical)
    lookup = {
        raw: next(iter(targets))
        for raw, targets in raw_targets.items()
        if len(targets) == 1
    }
    return lookup, dict(canonical_frequency)


def canonical_operator(value: object, lookup: dict[str, str]) -> str:
    cleaned = clean_value(value)
    return lookup.get(normalize_text(cleaned), cleaned)


def valid_registration(value: object) -> str:
    key = normalize_text(value).replace(" ", "")
    if (
        key in {marker.replace(" ", "") for marker in INVALID_REGISTRATION_KEYS}
        or len(key) < 4
        or not any(character.isalpha() for character in key)
        or not any(character.isdigit() for character in key)
    ):
        return ""
    return key


def identity_key(row: dict[str, str]) -> tuple[str, str, str, str] | None:
    registration = valid_registration(row.get("registration"))
    country = normalize_text(row.get("country"))
    manufacturer = normalize_text(row.get("aircraft_manufacturer"))
    model = normalize_text(row.get("aircraft_model")) or normalize_text(row.get("aircraft_name"))
    if not all((registration, country, manufacturer, model)):
        return None
    return registration, country, manufacturer, model


def event_year(row: dict[str, str]) -> int | None:
    try:
        return int(clean_value(row.get("event_year")))
    except ValueError:
        return None


def build_identity_references(
    files: Iterable[Path],
    lookup: dict[str, str],
) -> dict[tuple[str, str, str, str], list[tuple[int, str]]]:
    references: dict[tuple[str, str, str, str], list[tuple[int, str]]] = defaultdict(list)
    for source_path in files:
        with source_path.open("r", encoding="utf-8-sig", newline="") as source:
            reader = csv.DictReader(source)
            for row in reader:
                current = canonical_operator(row.get("operator"), lookup)
                key = identity_key(row)
                year = event_year(row)
                if (
                    generic_operator(current)
                    or not looks_named_organization(current)
                    or key is None
                    or year is None
                ):
                    continue
                references[key].append((year, current))
    return references


def identity_operator(
    row: dict[str, str],
    references: dict[tuple[str, str, str, str], list[tuple[int, str]]],
) -> str | None:
    key = identity_key(row)
    year = event_year(row)
    if key is None or year is None:
        return None
    nearby = [
        (abs(reference_year - year), operator)
        for reference_year, operator in references.get(key, ())
        if abs(reference_year - year) <= MAX_IDENTITY_YEAR_GAP
    ]
    if not nearby:
        return None
    minimum_gap = min(gap for gap, _ in nearby)
    closest = {operator for gap, operator in nearby if gap == minimum_gap}
    return next(iter(closest)) if len(closest) == 1 else None


def candidate_prefixes(captured: str) -> list[str]:
    tokens = normalize_text(captured).split()
    while tokens and tokens[0] in LEADING_ENTITY_WORDS:
        tokens.pop(0)
    if not tokens:
        return []
    stop = next(
        (index for index, token in enumerate(tokens[1:], start=1) if token in TRAILING_CLAUSE_WORDS),
        len(tokens),
    )
    tokens = tokens[:stop]
    return [" ".join(tokens[:length]) for length in range(min(len(tokens), 14), 0, -1)]


def narrative_operator(row: dict[str, str], lookup: dict[str, str]) -> tuple[str | None, bool]:
    text = "\n".join(
        clean_value(row.get(field))
        for field in ("title", "narrative", "history_of_this_aircraft")
        if clean_value(row.get(field))
    )
    candidates: set[str] = set()
    for pattern in OPERATOR_CUE_PATTERNS:
        for match in pattern.finditer(text):
            for prefix in candidate_prefixes(match.group(1)):
                candidate = lookup.get(prefix)
                if candidate and looks_named_organization(candidate):
                    candidates.add(candidate)
                    break
    if len(candidates) == 1:
        return next(iter(candidates)), False
    return None, len(candidates) > 1


def classify_operator(
    row: dict[str, str],
    lookup: dict[str, str],
    references: dict[tuple[str, str, str, str], list[tuple[int, str]]],
) -> tuple[str, str]:
    current = canonical_operator(row.get("operator"), lookup)
    if not generic_operator(current):
        method = "dictionary_standardized" if current != clean_value(row.get("operator")) else "retained_specific"
        return current, method

    narrative, conflict = narrative_operator(row, lookup)
    if narrative:
        return narrative, "narrative_operator_statement"
    if conflict:
        return FALLBACK_OPERATOR, "narrative_conflict_fallback"

    identity = identity_operator(row, references)
    if identity:
        return identity, "matching_aircraft_identity"

    return FALLBACK_OPERATOR, "non_recorded_fallback"


def part_files(parts_dir: Path) -> list[Path]:
    files = sorted(parts_dir.glob("aviation_events_part_*.csv"))
    if len(files) != 17:
        raise RuntimeError(f"Expected 17 part files in {parts_dir}, found {len(files)}")
    return files


def analyze_or_stage(
    files: Iterable[Path],
    lookup: dict[str, str],
    references: dict[tuple[str, str, str, str], list[tuple[int, str]]],
    staging_dir: Path | None,
) -> dict[str, object]:
    before: Counter[str] = Counter()
    after: Counter[str] = Counter()
    methods: Counter[str] = Counter()
    transitions: Counter[str] = Counter()
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
                if not reader.fieldnames or "operator" not in reader.fieldnames:
                    raise RuntimeError(f"{source_path} does not contain operator")
                if target_path:
                    target = target_path.open("w", encoding="utf-8", newline="")
                    writer = csv.DictWriter(target, fieldnames=reader.fieldnames)
                    writer.writeheader()
                else:
                    writer = None

                for row in reader:
                    row_count += 1
                    total_rows += 1
                    original = clean_value(row.get("operator")) or "<blank>"
                    normalized, method = classify_operator(row, lookup, references)
                    before[original] += 1
                    after[normalized] += 1
                    methods[method] += 1
                    if original != normalized:
                        transitions[f"{original} -> {normalized}"] += 1
                    if method not in {"retained_specific"} and len(examples[method]) < 25:
                        examples[method].append(
                            {
                                "asn_id": row.get("asn_id", ""),
                                "before": original,
                                "after": normalized,
                                "event_year": row.get("event_year", ""),
                                "registration": row.get("registration", ""),
                                "title": row.get("title", ""),
                                "country": row.get("country", ""),
                                "aircraft_manufacturer": row.get("aircraft_manufacturer", ""),
                                "aircraft_model": row.get("aircraft_model", ""),
                                "narrative_excerpt": clean_value(row.get("narrative"))[:500],
                            }
                        )
                    if writer:
                        row["operator"] = normalized
                        writer.writerow(row)
        finally:
            if target:
                target.close()
        file_rows[source_path.name] = row_count

    remaining_generic = sum(
        count for operator, count in after.items() if generic_operator(operator)
    )
    return {
        "total_rows": total_rows,
        "before_distinct_operators": len(before),
        "after_distinct_operators": len(after),
        "before_generic_rows": sum(
            count for operator, count in before.items() if operator == "<blank>" or generic_operator(operator)
        ),
        "after_generic_rows": remaining_generic,
        "non_recorded_rows": after.get(FALLBACK_OPERATOR, 0),
        "changed_rows": sum(transitions.values()),
        "resolution_methods": dict(methods.most_common()),
        "most_common_transitions": dict(transitions.most_common(100)),
        "after_operator_counts": dict(after.most_common(100)),
        "method_examples": dict(examples),
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
    parser = argparse.ArgumentParser(description="Normalize operator values across all aviation event CSV parts.")
    parser.add_argument("--parts-dir", type=Path, default=DEFAULT_PARTS_DIR)
    parser.add_argument("--dictionary", type=Path, default=DEFAULT_DICTIONARY)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--apply", action="store_true", help="Write normalized operator values to all 17 part files.")
    return parser.parse_args()


def main() -> int:
    configure_csv()
    args = parse_args()
    files = part_files(args.parts_dir)
    lookup, dictionary_frequency = load_operator_dictionary(args.dictionary)
    references = build_identity_references(files, lookup)
    staging_dir = args.parts_dir / ".operator_staging" if args.apply else None
    if staging_dir and staging_dir.exists():
        shutil.rmtree(staging_dir)

    try:
        report = analyze_or_stage(files, lookup, references, staging_dir)
        report.update(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "applied": bool(args.apply),
                "fallback_operator": FALLBACK_OPERATOR,
                "dictionary_unambiguous_aliases": len(lookup),
                "dictionary_canonical_operators": len(dictionary_frequency),
                "aircraft_identity_keys": len(references),
                "maximum_identity_year_gap": MAX_IDENTITY_YEAR_GAP,
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
