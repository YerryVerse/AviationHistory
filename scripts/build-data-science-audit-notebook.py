from pathlib import Path

import nbformat as nbf


repo_root = Path(__file__).resolve().parents[1]
output_path = repo_root / "docs" / "data-science-chart-audit.ipynb"

notebook = nbf.v4.new_notebook()
notebook["metadata"]["kernelspec"] = {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3",
}
notebook["metadata"]["language_info"] = {"name": "python", "version": "3"}

cells = [
    nbf.v4.new_markdown_cell(
        """# Data Science Chart Data Audit

## tl;dr

- The partitioned Parquet source reconciles to **396,753 event rows across 125 yearly partitions (1902–2026)**.
- The Data Science page contains **54 chart cards but no runtime dataset access**. Its visual values are embedded literals or generated placeholder series, so the page cannot guarantee correct filter behavior or freshness.
- The red portion of the `0 survivors` row is valid for **93,349 events with zero survivors and at least one onboard fatality**. The separate blue portion contains zero recorded fatalities; sentinel-zero handling still needs to remain explicit.
- The Data Science visualization suite is therefore assessed as **Needs revision** even though the underlying Parquet source passes the basic row/partition reconciliation checks.
"""
    ),
    nbf.v4.new_markdown_cell(
        """## Context & Methods

This notebook validates the Data Science portal cards against the local partitioned event dataset.

### Key Assumptions

- One Parquet row represents one aviation event.
- `asn_id` is the intended event identifier.
- A fatal event has `fatalities_onboard > 0`.
- Adjacent count bands are mutually exclusive: `0`, `1`, `2`, `3`, `4–5`, `6–10`, `11–50`, `51–100`, `101+`.
- Numeric zeros can be genuine values or normalized missing values; cross-field checks are used before interpreting them.
"""
    ),
    nbf.v4.new_code_cell(
        """from pathlib import Path
import json
import re

import duckdb
import pandas as pd
from IPython.display import display

cwd = Path.cwd()
repo_root = cwd if (cwd / "Website").exists() else cwd.parent
website_root = repo_root / "Website"
manifest_path = website_root / "public" / "data" / "manifest.json"
schema_path = website_root / "public" / "data" / "schema.json"
quality_path = website_root / "public" / "data" / "quality.json"
component_path = website_root / "components" / "DataScienceView.tsx"
page_path = website_root / "app" / "page.tsx"
parquet_glob = (website_root / "public" / "data" / "events" / "year=*" / "events.parquet").as_posix()

manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
schema = json.loads(schema_path.read_text(encoding="utf-8"))
quality = json.loads(quality_path.read_text(encoding="utf-8"))
component_source = component_path.read_text(encoding="utf-8")
page_source = page_path.read_text(encoding="utf-8")
con = duckdb.connect()
source_sql = f"read_parquet('{parquet_glob}', union_by_name=true)"

print(f"Repository: {repo_root}")
print(f"Source: {parquet_glob}")"""
    ),
    nbf.v4.new_markdown_cell("## Data"),
    nbf.v4.new_code_cell(
        """profile = con.execute(f'''
SELECT
  COUNT(*) AS rows,
  COUNT(DISTINCT asn_id) AS distinct_asn_ids,
  MIN(year) AS first_year,
  MAX(year) AS last_year,
  COUNT(DISTINCT year) AS years
FROM {source_sql}
''').df()

partition_rows = sum(item["rows"] for item in manifest["years"])
source_summary = pd.DataFrame([{
    "manifest_rows": manifest["total_rows"],
    "partition_row_sum": partition_rows,
    "parquet_rows": int(profile.loc[0, "rows"]),
    "distinct_asn_ids": int(profile.loc[0, "distinct_asn_ids"]),
    "year_partitions": len(manifest["years"]),
    "first_year": int(profile.loc[0, "first_year"]),
    "last_year": int(profile.loc[0, "last_year"]),
}])
display(source_summary)"""
    ),
    nbf.v4.new_code_cell(
        """parquet_columns = con.execute(f"DESCRIBE SELECT * FROM {source_sql}").df()
schema_summary = pd.DataFrame([{
    "manifest_field_count": manifest["field_count"],
    "parquet_column_count": len(parquet_columns),
    "quality_profiled_fields": len(quality["columns"]),
}])
display(schema_summary)
display(parquet_columns[["column_name", "column_type"]].head(15))"""
    ),
    nbf.v4.new_markdown_cell("## Results"),
    nbf.v4.new_markdown_cell("### 1. Inventory the Data Science cards and their lineage"),
    nbf.v4.new_code_cell(
        """card_pattern = re.compile(
    r'\\n        \\{\\n          id: "([^"]+)",\\n'
    r'          fieldName: "([^"]+)",\\n'
    r'          fieldKey: "([^"]+)",\\n'
    r'          dataType: "([^"]+)",\\n'
    r'          chartType: "([^"]+)",'
)
matches = list(card_pattern.finditer(component_source))
inventory_rows = []
parquet_field_names = set(parquet_columns["column_name"])

for index, match in enumerate(matches):
    start = match.start()
    end = matches[index + 1].start() if index + 1 < len(matches) else len(component_source)
    block = component_source[start:end]
    inventory_rows.append({
        "id": match.group(1),
        "field_name": match.group(2),
        "field_key": match.group(3),
        "data_type": match.group(4),
        "chart_type": match.group(5),
        "field_exists_in_parquet": match.group(3) in parquet_field_names,
        "numeric_literals": len(re.findall(r'(?<![A-Za-z_])\\d[\\d_]*(?:\\.\\d+)?', block)),
        "runtime_data_reference": bool(re.search(r'fetch\\(|duckdb|parquet|manifest|useDataset|staticData', block, re.I)),
    })

inventory = pd.DataFrame(inventory_rows)
lineage_summary = pd.DataFrame([{
    "chart_cards": len(inventory),
    "cards_with_runtime_data_reference": int(inventory["runtime_data_reference"].sum()),
    "cards_with_missing_source_field": int((~inventory["field_exists_in_parquet"]).sum()),
    "cards_with_embedded_numeric_literals": int((inventory["numeric_literals"] > 0).sum()),
    "component_has_runtime_data_reference": bool(re.search(
        r'fetch\\(|duckdb|parquet|manifest|useDataset|staticData',
        component_source,
        re.I,
    )),
    "component_accepts_data_or_filter_props": not bool(re.search(
        r'export default function DataScienceView\\(\\)',
        component_source,
    )),
    "page_passes_props_to_component": "<DataScienceView />" not in page_source,
}])
display(lineage_summary)
display(inventory)"""
    ),
    nbf.v4.new_markdown_cell("### 2. Check zero-value semantics and cross-field consistency"),
    nbf.v4.new_code_cell(
        """zero_semantics = con.execute(f'''
SELECT
  COUNT(*) FILTER (WHERE survivors_onboard = 0) AS zero_survivor_rows,
  COUNT(*) FILTER (
    WHERE survivors_onboard = 0 AND fatalities_onboard > 0
  ) AS zero_survivors_with_onboard_fatalities,
  COUNT(*) FILTER (
    WHERE survivors_onboard = 0 AND fatalities_onboard = 0
  ) AS zero_survivors_without_onboard_fatalities,
  COUNT(*) FILTER (
    WHERE occupants = 0 AND survivors_onboard = 0 AND fatalities_onboard = 0
  ) AS all_three_zero,
  COUNT(*) FILTER (
    WHERE occupants > 0 AND survivors_onboard = 0 AND fatalities_onboard = 0
  ) AS positive_occupants_but_zero_outcomes
FROM {source_sql}
''').df()
display(zero_semantics)"""
    ),
    nbf.v4.new_code_cell(
        """consistency = con.execute(f'''
SELECT
  COUNT(*) AS rows,
  COUNT(*) FILTER (
    WHERE occupants > 0
      AND occupants <> fatalities_onboard + survivors_onboard
  ) AS occupant_equation_mismatches,
  COUNT(*) FILTER (
    WHERE fatalities_total <> fatalities_onboard + fatalities_ground
  ) AS fatality_total_mismatches,
  COUNT(*) FILTER (WHERE occupants < 0) AS negative_occupants,
  COUNT(*) FILTER (WHERE fatalities_onboard < 0) AS negative_onboard_fatalities,
  COUNT(*) FILTER (WHERE survivors_onboard < 0) AS negative_survivors
FROM {source_sql}
''').df()
display(consistency)"""
    ),
    nbf.v4.new_markdown_cell("### 3. Recompute the fatality and survivor bands"),
    nbf.v4.new_code_cell(
        """band_case = '''
CASE
  WHEN {field} = 0 THEN '0'
  WHEN {field} = 1 THEN '1'
  WHEN {field} = 2 THEN '2'
  WHEN {field} = 3 THEN '3'
  WHEN {field} BETWEEN 4 AND 5 THEN '4–5'
  WHEN {field} BETWEEN 6 AND 10 THEN '6–10'
  WHEN {field} BETWEEN 11 AND 50 THEN '11–50'
  WHEN {field} BETWEEN 51 AND 100 THEN '51–100'
  ELSE '101+'
END
'''
band_order = ["0", "1", "2", "3", "4–5", "6–10", "11–50", "51–100", "101+"]

fatality_bands = con.execute(f'''
SELECT
  {band_case.format(field="fatalities_onboard")} AS band,
  COUNT(*) AS events
FROM {source_sql}
GROUP BY band
''').df()
fatality_bands["band"] = pd.Categorical(fatality_bands["band"], band_order, ordered=True)
fatality_bands = fatality_bands.sort_values("band")

survivor_bands = con.execute(f'''
SELECT
  {band_case.format(field="survivors_onboard")} AS band,
  COUNT(*) FILTER (WHERE fatalities_onboard > 0) AS fatal_events,
  COUNT(*) FILTER (WHERE fatalities_onboard = 0) AS non_fatal_events,
  COUNT(*) AS events
FROM {source_sql}
GROUP BY band
''').df()
survivor_bands["band"] = pd.Categorical(survivor_bands["band"], band_order, ordered=True)
survivor_bands = survivor_bands.sort_values("band")

display(fatality_bands)
display(survivor_bands)
print("Fatality bands reconcile:", int(fatality_bands["events"].sum()))
print("Survivor bands reconcile:", int(survivor_bands["events"].sum()))"""
    ),
    nbf.v4.new_markdown_cell("### 4. Spot-check embedded chart claims against Parquet"),
    nbf.v4.new_code_cell(
        """actual_year = con.execute(f'''
SELECT
  year,
  COUNT(*) AS events,
  COUNT(*) FILTER (WHERE fatalities_onboard > 0) AS fatal_events
FROM {source_sql}
GROUP BY year
ORDER BY year
''').df()

def generated_yearly_data():
    rows = []
    for year in range(1902, 2027):
        if year < 1914:
            count = int(6 + (year - 1902) * 22)
            fatal = int(count * 0.6)
        elif year <= 1918:
            count = int(1500 + (year - 1914) * 1800)
            fatal = int(count * 0.55)
        elif year <= 1938:
            count = int(1200 + ((year - 1918) % 7) * 450)
            fatal = int(count * 0.45)
        elif year <= 1945:
            count = [12400, 16800, 19200, 21500, 22100, 23029, 18500][year - 1939]
            fatal = int(count * 0.48)
        elif year <= 1980:
            count = int(4800 - (year - 1945) * 20 + ((year % 5) * 140))
            fatal = int(count * 0.38)
        elif year <= 2000:
            count = int(4200 + ((year % 4) * 180))
            fatal = int(count * 0.28)
        elif year <= 2025:
            count = int(5200 - (year - 2000) * 45 + ((year % 3) * 120))
            fatal = int(count * 0.22)
        else:
            count = 3650
            fatal = 620
        rows.append({"year": year, "generated_events": count, "generated_fatal_events": fatal})
    return pd.DataFrame(rows)

generated_year = generated_yearly_data()
year_reconciliation = actual_year.merge(generated_year, on="year")
year_reconciliation["event_delta"] = (
    year_reconciliation["generated_events"] - year_reconciliation["events"]
)
year_summary = pd.DataFrame([{
    "actual_events": int(actual_year["events"].sum()),
    "generated_events": int(generated_year["generated_events"].sum()),
    "absolute_event_error": int(year_reconciliation["event_delta"].abs().sum()),
    "years_with_exact_event_match": int((year_reconciliation["event_delta"] == 0).sum()),
}])
display(year_summary)
display(year_reconciliation.loc[
    year_reconciliation["event_delta"].abs().nlargest(10).index,
    ["year", "events", "generated_events", "event_delta"],
].sort_values("event_delta", key=abs, ascending=False))"""
    ),
    nbf.v4.new_code_cell(
        """damage_actual = con.execute(f'''
SELECT aircraft_damage, COUNT(*) AS events
FROM {source_sql}
GROUP BY aircraft_damage
ORDER BY events DESC
LIMIT 12
''').df()

phase_actual = con.execute(f'''
SELECT phase, COUNT(*) AS events
FROM {source_sql}
GROUP BY phase
ORDER BY events DESC
LIMIT 12
''').df()

display(damage_actual)
display(phase_actual)"""
    ),
    nbf.v4.new_markdown_cell(
        """## Takeaways

1. **Underlying source reconciliation:** The yearly Parquet partitions reconcile to the manifest total and expected date span.
2. **Zero-survivor interpretation:** Red in the zero-survivor row is valid when `fatalities_onboard > 0`; it must not be treated as a zero-fatality category.
3. **Dashboard lineage blocker:** The Data Science component has no runtime data dependency. All 54 cards are static or generated in component code, so displayed values cannot be assumed to reflect filters or refreshed data.
4. **Required remediation:** Replace embedded arrays and generated series with aggregates computed from the same filtered data layer used by the rest of the portal. Add automated subtotal and cross-field tests for every chart.
5. **Sharing status:** **Needs revision** until the charts are runtime-bound and reconciled.
"""
    ),
]

notebook["cells"] = cells
output_path.parent.mkdir(parents=True, exist_ok=True)
nbf.write(notebook, output_path)
print(output_path)
