import duckdb
import json
import os

con = duckdb.connect()
parquet_glob = 't:/AI/Aviation History/Website/public/data/events/*/*.parquet'

print("Calculating full exact dataset metrics from DuckDB...")

# Global totals
tot_row = con.execute(f"""
    SELECT 
        COUNT(*) as total_events,
        SUM(COALESCE(fatalities_onboard, 0)) as total_fatalities_onboard,
        SUM(COALESCE(fatalities_ground, 0)) as total_fatalities_ground,
        SUM(COALESCE(fatalities_total, 0)) as total_fatalities_total,
        SUM(COALESCE(survivors_onboard, 0)) as total_survivors_onboard,
        SUM(COALESCE(occupants, 0)) as total_occupants
    FROM '{parquet_glob}'
""").fetchone()

total_events = tot_row[0]
total_fat_total = tot_row[3]
total_survivors = tot_row[4]

# 1. Occurrence (Category)
occ_rows = con.execute(f"""
    SELECT 
        CASE 
            WHEN category = 'Accident' THEN 'Accident'
            WHEN category = 'Incident' THEN 'Incident'
            WHEN category = 'Shotdown' THEN 'Shotdown'
            ELSE 'Other'
        END as cat_group,
        COUNT(*) as cnt,
        SUM(COALESCE(fatalities_total, 0)) as deaths_total,
        SUM(COALESCE(survivors_onboard, 0)) as survivors_onboard
    FROM '{parquet_glob}'
    GROUP BY cat_group
    ORDER BY cnt DESC
""").fetchall()

occurrence = []
for r in occ_rows:
    cnt = r[1]
    pct = round((cnt * 100.0 / total_events), 1)
    d = r[2]
    s = r[3]
    d_rate = round((d * 100.0 / (d + s)), 1) if (d + s) > 0 else 0.0
    s_rate = round((s * 100.0 / (d + s)), 1) if (d + s) > 0 else 100.0
    occurrence.append({
        "name": r[0],
        "count": cnt,
        "pct": f"{pct}%",
        "value": pct,
        "deaths": f"{d:,}",
        "deathCount": d,
        "deathRate": f"{d_rate}%",
        "survivors": f"{s:,}",
        "survivorCount": s,
        "survivorRate": f"{s_rate}%",
    })

# 2. Confidence Rating
conf_rows = con.execute(f"""
    SELECT 
        COALESCE(confidence_rating, 'Limited Info') as rating,
        COUNT(*) as cnt,
        SUM(COALESCE(fatalities_total, 0)) as deaths,
        SUM(COALESCE(survivors_onboard, 0)) as survivors
    FROM '{parquet_glob}'
    GROUP BY rating
    ORDER BY cnt DESC
""").fetchall()

confidence = []
for r in conf_rows:
    cnt = r[1]
    pct = round((cnt * 100.0 / total_events), 1)
    d = r[2]
    s = r[3]
    d_rate = round((d * 100.0 / (d + s)), 1) if (d + s) > 0 else 0.0
    s_rate = round((s * 100.0 / (d + s)), 1) if (d + s) > 0 else 100.0
    confidence.append({
        "name": r[0],
        "count": cnt,
        "pct": f"{pct}%",
        "value": pct,
        "deaths": f"{d:,}",
        "deathRate": f"{d_rate}%",
        "survivors": f"{s:,}",
        "survivorRate": f"{s_rate}%",
    })

kpi_data = {
    "totalEvents": total_events,
    "totalFatalities": total_fat_total,
    "totalSurvivors": total_survivors,
    "occurrence": occurrence,
    "confidence": confidence,
}

out_path = "t:/AI/Aviation History/Website/public/data/kpi_metrics.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(kpi_data, f, indent=2)

print(f"Generated {out_path} with full calculated database metrics.")
