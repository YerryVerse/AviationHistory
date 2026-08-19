import pandas as pd
import numpy as np

csv_path = r"t:\AI\Aviation History\scraper\data\csv\data\aviation_events_master.csv"
df = pd.read_csv(csv_path, low_memory=False)

fatalities_total = int(pd.to_numeric(df['fatalities_total'], errors='coerce').fillna(0).sum())
fatalities_onboard = int(pd.to_numeric(df['fatalities_onboard'], errors='coerce').fillna(0).sum())
fatalities_ground = int(pd.to_numeric(df['fatalities_ground'], errors='coerce').fillna(0).sum())
occupants = int(pd.to_numeric(df['occupants'], errors='coerce').fillna(0).sum())

if 'survivors_onboard' in df.columns:
    survivors = int(pd.to_numeric(df['survivors_onboard'], errors='coerce').fillna(0).sum())
else:
    survivors = max(0, occupants - fatalities_onboard)

fatality_rate = (fatalities_onboard / occupants * 100) if occupants > 0 else 0
survival_rate = (survivors / occupants * 100) if occupants > 0 else 0

print("--- KPI #4 (fatalities_total) EXACT RAW DATASET METRICS ---")
print(f"Total Fatalities (fatalities_total): {fatalities_total:,}")
print(f"  - On-Board Fatalities (fatalities_onboard): {fatalities_onboard:,}")
print(f"  - Ground Fatalities (fatalities_ground): {fatalities_ground:,}")
print(f"Total On-Board Occupants (occupants): {occupants:,}")
print(f"Total On-Board Survivors (survivors_onboard): {survivors:,}")
print(f"On-Board Fatality Rate: {fatality_rate:.2f}% ({fatality_rate:.4f}%)")
print(f"On-Board Survival Rate: {survival_rate:.2f}% ({survival_rate:.4f}%)")
