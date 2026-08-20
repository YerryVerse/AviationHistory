import os
import csv
from pathlib import Path

csv_path = Path(r"t:\AI\Aviation History\scraper\data\csv\data\aviation_events_master.csv")
parts_dir = Path(r"t:\AI\Aviation History\scraper\data\csv\data\parts")

# Set csv limit to max
csv.field_size_limit(10_000_000)

print(f"Reading master CSV from {csv_path} ...")
if not csv_path.exists():
    raise FileNotFoundError(f"Master CSV not found at {csv_path}")

parts_dir.mkdir(parents=True, exist_ok=True)

# Delete existing parts in the directory first to avoid mixing old/new parts
for f in parts_dir.glob("*.csv"):
    try:
        f.unlink()
    except Exception as e:
        print(f"Warning: could not delete old part {f.name}: {e}")

rows_per_file = 25000

with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
    reader = csv.reader(source)
    header = next(reader)
    
    current_part = 1
    current_rows = []
    
    for row_idx, row in enumerate(reader, start=1):
        current_rows.append(row)
        
        if len(current_rows) == rows_per_file:
            part_path = parts_dir / f"aviation_events_part_{current_part:02d}.csv"
            with part_path.open("w", encoding="utf-8", newline="") as target:
                writer = csv.writer(target)
                writer.writerow(header)
                writer.writerows(current_rows)
            print(f"Saved {part_path.name} with {len(current_rows):,} rows.")
            current_rows = []
            current_part += 1
            
    # Save remaining rows
    if current_rows:
        part_path = parts_dir / f"aviation_events_part_{current_part:02d}.csv"
        with part_path.open("w", encoding="utf-8", newline="") as target:
            writer = csv.writer(target)
            writer.writerow(header)
            writer.writerows(current_rows)
        print(f"Saved {part_path.name} with {len(current_rows):,} rows.")

print("Split completed successfully!")
