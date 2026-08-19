import pandas as pd
import numpy as np

csv_path = r"t:\AI\Aviation History\scraper\data\csv\data\aviation_events_master.csv"

df = pd.read_csv(csv_path, low_memory=False)
print("Total rows in dataset:", len(df))

df['year'] = pd.to_numeric(df['event_year'], errors='coerce')
df['fatalities'] = pd.to_numeric(df['fatalities_total'], errors='coerce').fillna(0)
df['occupants_cnt'] = pd.to_numeric(df['occupants'], errors='coerce').fillna(0)

# If survivors_onboard is present:
if 'survivors_onboard' in df.columns:
    df['survivors'] = pd.to_numeric(df['survivors_onboard'], errors='coerce').fillna(0)
else:
    df['survivors'] = np.maximum(0, df['occupants_cnt'] - df['fatalities'])

eras = [
    ("pioneer", "Pioneer Era", 1902, 1913),
    ("ww1", "World War I", 1914, 1918),
    ("interwar", "Interwar Era", 1919, 1938),
    ("ww2", "World War II", 1939, 1945),
    ("coldwar", "Cold War", 1946, 1970),
    ("commercial", "Commercial Era", 1971, 1999),
    ("modern", "Modern Digital Era", 2000, 2026),
]

print("\n--- EXACT RAW UNROUNDED ERA STATS ---")
for era_id, title, start_yr, end_yr in eras:
    sub = df[(df['year'] >= start_yr) & (df['year'] <= end_yr)]
    events = len(sub)
    deaths = int(sub['fatalities'].sum())
    survivors = int(sub['survivors'].sum())
    total_people = deaths + survivors
    d_rate = (deaths / total_people * 100) if total_people > 0 else 0
    s_rate = (survivors / total_people * 100) if total_people > 0 else 0
    print(f"id: '{era_id}', title: '{title}', years: '{start_yr} – {end_yr}', deaths: '{deaths:,}', survivors: '{survivors:,}', deathRate: '{d_rate:.1f}%', survivorRate: '{s_rate:.1f}%'")

print("\n--- DATASET OVERALL KEY STATS ---")
min_yr = int(df['year'].min())
max_yr = int(df['year'].max())
total_records = len(df)
print(f"Total Dataset Records: {total_records:,}")
print(f"Min Year: {min_yr}, Max Year: {max_yr}, Span: {max_yr - min_yr + 1} Years")

# Peak year
year_counts = df.groupby('year').size()
peak_year = int(year_counts.idxmax())
peak_events = int(year_counts.max())
print(f"Peak Year: {peak_year} ({peak_events:,} events)")
print(f"Yearly Average: {len(df) / (max_yr - min_yr + 1):.1f}")
