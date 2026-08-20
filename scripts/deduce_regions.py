"""
deduce_regions.py
Exhaustively deduces country, continent, and region for all aviation events
where region is missing, Unknown, or blank. If after multi-field analysis a region
cannot be determined, sets region to "Not Recorded".
"""

import sys
import csv
import re
import pandas as pd
from pathlib import Path

csv.field_size_limit(sys.maxsize)

MASTER_CSV = Path(r"t:\AI\Aviation History\scraper\data\csv\data\aviation_events_master.csv")
COUNTRY_DICT = Path(r"t:\AI\Aviation History\scraper\data\csv\dictionaries\country_dictionary.csv")

# ── 1. Comprehensive Regional Mapping Rules ───────────────────────────────────

# Geographic and historical keywords mapped to (region, continent)
REGION_PATTERNS = [
    # Oceans / Seas / Naval Carriers
    (re.compile(r'\b(uss |hms |aircraft carrier|pacific ocean|atlantic ocean|indian ocean|north sea|mediterranean sea|black sea|baltic sea|caribbean sea|gulf of mexico|persian gulf|sea of japan|barents sea|midway|guam|wake island|johnston atoll)\b', re.IGNORECASE), ('Oceans/Seas', 'Oceans/Seas')),
    
    # Western Europe (including WWI/WWII Western Front sites)
    (re.compile(r'\b(france|french|bapaume|ayette|hesbecourt|givenchy|arras|somme|verdun|flanders|ypres|cambrai|marne|normandy|boelcke|jasta|luftstreitkräfte|royal flying corps|rfc|england|britain|united kingdom|germany|german|belgium|netherlands|switzerland|berquin|fère|fere|bassée|bassee|lens|carvin|massiges|barlencourt|houthulst|gravenstafel|becelaere|bousbecque|izel|nieuport|hollebeke|sopwith|bristol|halberstadt|pfalz|fokker|caudron|spad|be2|fe2|re8|se5|rumpler|lfg roland|gotha|hannover|junkers|albatros|dfw|boesinghe|thielt|serre|fresnoy|acheville|marcoing|biache|beine|vaucelles|havrincourt|boesinghen|juvincourt|etaing|epehy|atilloncourt|annoeullin|aizy|linselles|touy|hauts-fourneaux|grancourt|fosse wood|armstrong whitworth|airco|aviatik)\b', re.IGNORECASE), ('Western Europe', 'Europe')),
    
    # Southern Europe
    (re.compile(r'\b(latisana|monte santo|motta|montello|podgorica|caporetto|piave|isonzo|trentino|trieste|venice|ancona|udine|macchi|ansaldo|caproni|sia|pomilio|italy|italian|greece|greek|spain|spanish|portugal|yugoslavia|serbia|croatia|bosnia|albania|malta|cyprus|fjeri|merna)\b', re.IGNORECASE), ('Southern Europe', 'Europe')),
    
    # Eastern Europe
    (re.compile(r'\b(russia|russian|soviet|ussr|black sea fleet|grigorovich|moscow|leningrad|stalingrad|ukraine|poland|romania|hungary|czech|bulgaria|nagorno|karabakh|armenia|azerbaijan|yakutia|siberia)\b', re.IGNORECASE), ('Eastern Europe', 'Europe')),

    # Northern Europe
    (re.compile(r'\b(sweden|norway|finland|denmark|iceland|estonia|latvia|lithuania)\b', re.IGNORECASE), ('Northern Europe', 'Europe')),

    # East Asia
    (re.compile(r'\b(korea|korean|seoul|pyongyang|inchon|pusan|japan|japanese|tokyo|osaka|okinawa|iwo jima|china|chinese|beijing|shanghai|taiwan|formosa)\b', re.IGNORECASE), ('East Asia', 'Asia')),

    # Southeast Asia
    (re.compile(r'\b(vietnam|vietnamese|saigon|hanoi|da nang|philippines|manila|thailand|bangkok|indonesia|jakarta|malaysia|singapore|laos|cambodia|myanmar|burma)\b', re.IGNORECASE), ('Southeast Asia', 'Asia')),

    # South Asia
    (re.compile(r'\b(india|indian|pakistan|bangladesh|sri lanka|nepal|afghanistan)\b', re.IGNORECASE), ('South Asia', 'Asia')),

    # Central Asia
    (re.compile(r'\b(kazakhstan|uzbekistan|turkmenistan|kyrgyzstan|tajikistan)\b', re.IGNORECASE), ('Central Asia', 'Asia')),

    # Middle East
    (re.compile(r'\b(israel|egypt|iran|iraq|saudi arabia|turkey|syria|jordan|lebanon|uae|dubai|yemen|oman|qatar|kuwait)\b', re.IGNORECASE), ('Middle East', 'Asia')),

    # North Africa
    (re.compile(r'\b(morocco|algeria|tunisia|libya|sudan)\b', re.IGNORECASE), ('North Africa', 'Africa')),

    # Sub-Saharan Africa
    (re.compile(r'\b(congo|nigeria|kenya|south africa|angola|ethiopia|uganda|zambia|zimbabwe|mozambique|ghana|tanzania)\b', re.IGNORECASE), ('Sub-Saharan Africa', 'Africa')),

    # North America
    (re.compile(r'\b(united states|usa|us air force|us navy|usmc|usaaf|california|texas|florida|new york|alaska|hawaii|canada|canadian|mexico)\b', re.IGNORECASE), ('North America', 'North America')),

    # Central America
    (re.compile(r'\b(guatemala|honduras|el salvador|nicaragua|costa rica|panama|belize)\b', re.IGNORECASE), ('Central America', 'North America')),

    # Caribbean
    (re.compile(r'\b(cuba|jamaica|haiti|dominican republic|puerto rico|bahamas|trinidad)\b', re.IGNORECASE), ('Caribbean', 'North America')),

    # South America
    (re.compile(r'\b(brazil|argentina|colombia|chile|peru|venezuela|ecuador|bolivia|uruguay|paraguay)\b', re.IGNORECASE), ('South America', 'South America')),

    # Australasia
    (re.compile(r'\b(australia|australian|new zealand|papua new guinea|tasmania|sydney|melbourne|brisbane|perth)\b', re.IGNORECASE), ('Australasia', 'Oceania')),
]

def deduce_row_region(row: dict[str, str]) -> tuple[str, str]:
    text_fields = [
        str(row.get('country') or ''),
        str(row.get('location') or ''),
        str(row.get('departure_airport') or ''),
        str(row.get('destination_airport') or ''),
        str(row.get('operator') or ''),
        str(row.get('narrative') or ''),
        str(row.get('title') or ''),
        str(row.get('aircraft_type') or ''),
        str(row.get('aircraft_name') or '')
    ]
    full_text = ' '.join(text_fields)

    for pattern, (region, continent) in REGION_PATTERNS:
        if pattern.search(full_text):
            return region, continent

    return 'Not Recorded', 'Not Recorded'

def main():
    print(f"Loading {MASTER_CSV} ...")
    df = pd.read_csv(MASTER_CSV, dtype=str, low_memory=False)
    print(f"Total rows: {len(df):,}")

    initial_unknown = df['region'].fillna('Unknown').isin(['Unknown', 'not recorded', '', 'nan', 'None']).sum()
    print(f"Initial Unknown / Blank Region Rows: {initial_unknown:,}")

    updated_count = 0
    not_recorded_count = 0

    for idx in range(len(df)):
        current_region = str(df.at[idx, 'region']).strip()
        if not current_region or current_region.lower() in {'unknown', 'nan', 'none', '', 'not recorded'}:
            row_dict = df.iloc[idx].to_dict()
            deduced_region, deduced_continent = deduce_row_region(row_dict)
            if deduced_region != 'Not Recorded':
                df.at[idx, 'region'] = deduced_region
                if pd.isna(df.at[idx, 'continent']) or str(df.at[idx, 'continent']).strip().lower() in {'unknown', 'nan', 'none', '', 'not recorded'}:
                    df.at[idx, 'continent'] = deduced_continent
                updated_count += 1
            else:
                df.at[idx, 'region'] = 'Not Recorded'
                not_recorded_count += 1

    print(f"\nDeduction Results:")
    print(f"  Successfully Deducted & Restored: {updated_count:,} rows")
    print(f"  Impossible to Determine (Set to 'Not Recorded'): {not_recorded_count:,} rows")

    print(f"\nFinal Region Value Counts:")
    print(df['region'].value_counts(dropna=False))

    print(f"\nSaving updated master CSV to {MASTER_CSV} ...")
    df.to_csv(MASTER_CSV, index=False, encoding="utf-8-sig")
    print("Master CSV saved successfully.")

if __name__ == "__main__":
    main()
