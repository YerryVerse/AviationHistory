import { parse } from "csv-parse/sync";

import { withBasePath } from "./basePath";


export interface YearlyFlightData {
  year: number;
  totalFlights: number;
  coverage: string;
  status: string;
  source: string;
  sourceUrl: string;
  notes: string;
}


export async function loadFlights(basePath = "", fetcher: typeof fetch = fetch): Promise<YearlyFlightData[]> {
  const url = withBasePath("/data/flights/global_annual_flights.csv", basePath);
  const response = await fetcher(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Unable to load static flight statistics (${response.status})`);
  const records = parse(await response.text(), { columns: true, skip_empty_lines: true, bom: true }) as Array<Record<string, string>>;
  return records.map((record, index) => {
    const year = Number(record.year);
    const totalFlights = Number(record.total_flights);
    if (!Number.isInteger(year) || !Number.isFinite(totalFlights) || totalFlights < 0) {
      throw new Error(`Invalid static flight row ${index + 2}`);
    }
    return {
      year,
      totalFlights,
      coverage: record.coverage,
      status: record.status,
      source: record.source,
      sourceUrl: record.source_url,
      notes: record.notes,
    };
  }).sort((left, right) => left.year - right.year);
}
