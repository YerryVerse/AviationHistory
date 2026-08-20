import csv
from pathlib import Path

master_path = Path(r"t:\AI\Aviation History\scraper\data\csv\data\aviation_events_master.csv")
parts_dir = Path(r"t:\AI\Aviation History\scraper\data\csv\data\parts")

# Set csv limit to max
csv.field_size_limit(10_000_000)

print(f"Searching for part files in {parts_dir} ...")
if not parts_dir.exists():
    raise FileNotFoundError(f"Parts directory not found at {parts_dir}")

part_files = sorted(list(parts_dir.glob("aviation_events_part_*.csv")))
if not part_files:
    raise FileNotFoundError(f"No part files found in {parts_dir}")

print(f"Found {len(part_files)} part files. Reassembling master CSV ...")

master_path.parent.mkdir(parents=True, exist_ok=True)

with master_path.open("w", encoding="utf-8-sig", newline="") as target:
    writer = csv.writer(target)
    
    # Write header from the first file
    with part_files[0].open("r", encoding="utf-8", newline="") as source:
        reader = csv.reader(source)
        header = next(reader)
        writer.writerow(header)
        
    # Append rows from all files
    total_rows = 0
    for idx, part_file in enumerate(part_files, start=1):
        with part_file.open("r", encoding="utf-8", newline="") as source:
            reader = csv.reader(source)
            next(reader) # Skip header
            rows_written = 0
            for row in reader:
                writer.writerow(row)
                rows_written += 1
            print(f"  [{idx:02d}/{len(part_files):02d}] Appended {rows_written:,} rows from {part_file.name}")
            total_rows += rows_written

print(f"Reassembly completed! Master CSV saved to {master_path} with {total_rows:,} rows.")
