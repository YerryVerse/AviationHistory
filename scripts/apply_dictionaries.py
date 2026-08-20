"""
apply_dictionaries.py
Applies all standardisation dictionaries (except aircraft) to
aviation_events_master.csv and writes the result in-place.

Dictionaries applied
---------------------
1. operator_dictionary      -> operator
2. country_dictionary       -> country / continent / region
3. icao_dictionary          -> icao_occurrence_category  (+  icao_code split-out)
4. investigating_agency     -> investigating_agency
5. airport_dictionary       -> departure_airport / departure_iata
                               destination_airport / destination_iata
"""

import pandas as pd
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
DATA_DIR  = Path(r"t:\AI\Aviation History\scraper\data\csv")
MASTER    = DATA_DIR / "data" / "aviation_events_master.csv"
DICT_DIR  = DATA_DIR / "dictionaries"
OUTPUT    = MASTER  # overwrite in-place

# ── Load master ────────────────────────────────────────────────────────────────
print("Loading master CSV …")
df = pd.read_csv(MASTER, encoding="utf-8-sig", dtype=str, low_memory=False)
print(f"  Rows: {len(df):,}  |  Columns: {len(df.columns)}")

# ── Helper: build lookup dict from a dictionary CSV ───────────────────────────
def build_lookup(path, raw_col, *value_cols):
    """Returns {raw_lower: (val1, val2, …)} ignoring blank raw values."""
    d = pd.read_csv(path, encoding="utf-8-sig", dtype=str).fillna("")
    lookup = {}
    for _, row in d.iterrows():
        key = str(row[raw_col]).strip().lower()
        if not key:
            continue
        lookup[key] = tuple(str(row[c]).strip() for c in value_cols)
    return lookup

# ── 1. Operator ────────────────────────────────────────────────────────────────
print("\n[1/5] Applying operator_dictionary …")
op_lookup = build_lookup(DICT_DIR / "operator_dictionary.csv",
                         "raw_operator", "operator")

def apply_operator(val):
    k = str(val).strip().lower()
    result = op_lookup.get(k)
    return result[0] if result and result[0] else str(val).strip()

before = df["operator"].nunique()
df["operator"] = df["operator"].apply(apply_operator)
after = df["operator"].nunique()
print(f"  Unique operators: {before:,} -> {after:,}")

# ── 2. Country ─────────────────────────────────────────────────────────────────
print("\n[2/5] Applying country_dictionary (with Continent & Region) …")
co_lookup = build_lookup(DICT_DIR / "country_dictionary.csv",
                         "raw_country", "country", "continent", "region")

def apply_country(val):
    k = str(val).strip().lower()
    result = co_lookup.get(k)
    return result[0] if result and result[0] else str(val).strip()

def apply_continent(val):
    k = str(val).strip().lower()
    result = co_lookup.get(k)
    return result[1] if result and result[1] and result[1] != "Unknown" else "Not Recorded"

def apply_region(val):
    k = str(val).strip().lower()
    result = co_lookup.get(k)
    return result[2] if result and result[2] and result[2] != "Unknown" else "Not Recorded"

# Ensure continent and region columns exist
if "continent" not in df.columns:
    idx = df.columns.get_loc("country") + 1
    df.insert(idx, "continent", "Unknown")
if "region" not in df.columns:
    idx = df.columns.get_loc("country") + 2
    df.insert(idx, "region", "Unknown")

before = df["country"].nunique()
# Map continent/region from raw country values first
df["continent"] = df["country"].apply(apply_continent)
df["region"]    = df["country"].apply(apply_region)
# Then update country column with standardized names
df["country"]   = df["country"].apply(apply_country)
after = df["country"].nunique()
print(f"  Unique countries: {before:,} -> {after:,}")
print(f"  Unique continents: {df['continent'].nunique()}")
print(f"  Unique regions: {df['region'].nunique()}")

# ── 3. ICAO occurrence category ────────────────────────────────────────────────
print("\n[3/5] Applying icao_dictionary …")
icao_lookup = build_lookup(DICT_DIR / "icao_dictionary.csv",
                           "raw_icao_occurrence_category",
                           "icao_code", "icao_occurrence_category")

def apply_icao_code(val):
    k = str(val).strip().lower()
    result = icao_lookup.get(k)
    return result[0] if result and result[0] else ""

def apply_icao_cat(val):
    k = str(val).strip().lower()
    result = icao_lookup.get(k)
    return result[1] if result and result[1] else str(val).strip()

if "icao_code" not in df.columns:
    idx = df.columns.get_loc("icao_occurrence_category") + 1
    df.insert(idx, "icao_code", "")

before = df["icao_occurrence_category"].nunique()
df["icao_code"]              = df["icao_occurrence_category"].apply(apply_icao_code)
df["icao_occurrence_category"] = df["icao_occurrence_category"].apply(apply_icao_cat)
after = df["icao_occurrence_category"].nunique()
print(f"  Unique ICAO categories: {before:,} -> {after:,}")

# ── 4. Investigating agency ────────────────────────────────────────────────────
print("\n[4/5] Applying investigating_agency_dictionary …")
ag_lookup = build_lookup(DICT_DIR / "investigating_agency_dictionary.csv",
                         "raw_agency", "investigating_agency")

def apply_agency(val):
    k = str(val).strip().lower()
    result = ag_lookup.get(k)
    return result[0] if result and result[0] else str(val).strip()

before = df["investigating_agency"].nunique()
df["investigating_agency"] = df["investigating_agency"].apply(apply_agency)
after = df["investigating_agency"].nunique()
print(f"  Unique agencies: {before:,} -> {after:,}")

# ── 5. Airport (departure + destination) ──────────────────────────────────────
print("\n[5/5] Applying airport_dictionary …")
ap_lookup = build_lookup(DICT_DIR / "airport_dictionary.csv",
                         "raw_airport", "airport_name", "iata")

def apply_airport_name(val):
    k = str(val).strip().lower()
    result = ap_lookup.get(k)
    return result[0] if result and result[0] else str(val).strip()

def apply_airport_iata(val):
    k = str(val).strip().lower()
    result = ap_lookup.get(k)
    return result[1] if result and result[1] else "Not Recorded"

# Departure
before_dep = df["departure_airport"].nunique()
df["departure_airport"] = df["departure_airport"].apply(apply_airport_name)
df["departure_iata"]    = df["departure_airport"].apply(apply_airport_iata)
df["departure_iata"]    = df["departure_iata"].fillna("Not Recorded").replace({"": "Not Recorded", "None": "Not Recorded", "NaN": "Not Recorded"})
after_dep = df["departure_airport"].nunique()

# Destination
before_dst = df["destination_airport"].nunique()
df["destination_airport"] = df["destination_airport"].apply(apply_airport_name)
df["destination_iata"]    = df["destination_airport"].apply(apply_airport_iata)
df["destination_iata"]    = df["destination_iata"].fillna("Not Recorded").replace({"": "Not Recorded", "None": "Not Recorded", "NaN": "Not Recorded"})
after_dst = df["destination_airport"].nunique()

print(f"  Unique departure airports:   {before_dep:,} -> {after_dep:,}")
print(f"  Unique destination airports: {before_dst:,} -> {after_dst:,}")

# ── 6. Aircraft (manufacturer, name, model, variant, common name, designation) ──
print("\n[6/6] Applying aircraft_dictionary …")
ac_dict_path = DICT_DIR / "aircraft_dictionary.csv"
if ac_dict_path.exists():
    ac_df = pd.read_csv(ac_dict_path, encoding="utf-8-sig", dtype=str).fillna("")
    ac_lookup = {}
    for _, r in ac_df.iterrows():
        k = str(r["Raw aircraft"]).strip().lower()
        if k:
            ac_lookup[k] = (
                str(r["Type"]).strip(),
                str(r["Designation"]).strip(),
                str(r["Manufacturer"]).strip(),
                str(r["Name"]).strip(),
                str(r["Model"]).strip(),
                str(r["Variant"]).strip(),
                str(r["Common name"]).strip(),
            )

    applied_ac_count = 0
    for idx in range(len(df)):
        raw = str(df.at[idx, "aircraft_type"] or "").strip().lower()
        if raw in ac_lookup:
            t, des, mfr, name, md, var, cname = ac_lookup[raw]
            if mfr and (pd.isna(df.at[idx, "aircraft_manufacturer"]) or str(df.at[idx, "aircraft_manufacturer"]).strip() in ["", "Not Recorded", "Unknown"]):
                df.at[idx, "aircraft_manufacturer"] = mfr
            if name and (pd.isna(df.at[idx, "aircraft_name"]) or str(df.at[idx, "aircraft_name"]).strip() in ["", "Not Recorded", "Unknown"]):
                df.at[idx, "aircraft_name"] = name
            if md and (pd.isna(df.at[idx, "aircraft_model"]) or str(df.at[idx, "aircraft_model"]).strip() in ["", "Not Recorded", "Unknown"]):
                df.at[idx, "aircraft_model"] = md
            if var and (pd.isna(df.at[idx, "aircraft_variant"]) or str(df.at[idx, "aircraft_variant"]).strip() in ["", "Not Recorded", "Unknown"]):
                df.at[idx, "aircraft_variant"] = var
            if cname and (pd.isna(df.at[idx, "aircraft_common_name"]) or str(df.at[idx, "aircraft_common_name"]).strip() in ["", "Not Recorded", "Unknown"]):
                df.at[idx, "aircraft_common_name"] = cname
            if des and des in ["Civil", "Military"]:
                df.at[idx, "aircraft_designation"] = des
            applied_ac_count += 1
    print(f"  Applied aircraft dictionary mapping to {applied_ac_count:,} rows")

# ── Save ───────────────────────────────────────────────────────────────────────
print(f"\nSaving to {OUTPUT} …")
df.to_csv(OUTPUT, index=False, encoding="utf-8-sig")
print(f"Done. Final shape: {df.shape[0]:,} rows x {df.shape[1]} columns")
