# Global Annual Flights Dataset

Dataset: `global_annual_flights.csv`

Metric: global aircraft departures / registered carrier departures. This is a flight-count proxy, not passenger volume.

Rows 1970-2023 use the World Bank WDI indicator `IS.AIR.DPRT`, `World/WLD`: air transport, registered carrier departures worldwide. The World Bank source for this indicator is ICAO.

Rows 2024-2026 use IATA's `Global Outlook for Air Transport - December 2025`, Table 2, `Aircraft departures, million`.

The 2026 row is not a full-year actual. It is an estimated year-to-date value through 2026-05-25, calculated from IATA's 40.3 million full-year 2026 forecast:

`40,300,000 * 145 / 365 = 16,005,479`

Known gap: the World Bank `World/WLD` row has no value for 1972 in the local source file, so 1972 is intentionally omitted rather than interpolated.

Primary sources:

- World Bank WDI `IS.AIR.DPRT`: https://data.worldbank.org/indicator/IS.AIR.DPRT
- IATA Global Outlook for Air Transport, December 2025: https://www.iata.org/en/iata-repository/publications/economic-reports/global-outlook-for-air-transport-december-2025/
