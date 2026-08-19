import { withBasePath } from "./basePath";
import type { ColumnQualityReport, NullMarker, QualityDataType, QualityReport } from "./types";


export const QUALITY_FIELDS = [
  "asn_id", "title", "occurrence_name", "category", "icao_occurrence_category", "confidence_rating", "meta_description",
  "meta_keywords", "meta_og_description", "meta_og_title", "meta_og_type", "date_raw", "event_date", "event_year",
  "event_month", "event_day", "event_weekday", "time_raw", "local_time", "time_zone", "aircraft_type", "aircraft_designation",
  "aircraft_manufacturer", "aircraft_name", "aircraft_model", "aircraft_variant", "aircraft_common_name", "operator", "registration", "msn", "year_of_manufacture",
  "engine_model", "cycles", "total_airframe_hrs", "aircraft_damage", "aircraft_disposition", "history_of_this_aircraft", "fatalities_raw",
  "other_fatalities_raw", "occupants", "fatalities_onboard", "survivors_onboard", "fatalities_ground", "fatalities_total",
  "survival_rate_onboard", "fatality_rate_onboard", "fatality_nationalities", "fatality_nationalities_total", "location_raw",
  "location", "country", "continent", "region", "approx_location_from_narrative", "gps_latitude", "gps_longitude", "phase_raw", "phase", "phase_label",
  "phase_group", "nature", "departure_airport_raw", "departure_airport", "departure_iata", "departure_icao",
  "destination_airport_raw", "destination_airport", "destination_iata", "destination_icao", "metar",
  "weather_or_visibility_mentioned", "investigating_agency", "accident_investigation_duration",
  "accident_investigation_investigating_agency", "accident_investigation_report", "accident_investigation_report_number",
  "accident_investigation_status", "accident_investigation_download_report", "narrative", "narrative_chars", "aircraft_image_alt",
  "aircraft_image_url", "media", "report_urls", "sources",
] as const;

export const NULL_MARKERS: NullMarker[] = ["database_null", "blank", "unknown", "n/a", "none", "nan", "undefined", "dash"];
const DATA_TYPES = new Set<QualityDataType>(["string", "integer", "float", "date", "json", "string_list"]);


function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function count(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) throw new Error(`${label} must be a non-negative integer`);
  return value as number;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function validateColumn(value: unknown, index: number, totalRows: number): ColumnQualityReport {
  const source = objectValue(value, `columns[${index}]`);
  if (typeof source.field !== "string" || !QUALITY_FIELDS.includes(source.field as typeof QUALITY_FIELDS[number])) throw new Error("Quality columns must use canonical fields");
  if (!DATA_TYPES.has(source.dataType as QualityDataType)) throw new Error(`columns[${index}].dataType is invalid`);
  const total = count(source.total, `columns[${index}].total`);
  const valid = count(source.valid, `columns[${index}].valid`);
  const invalid = count(source.invalid, `columns[${index}].invalid`);
  const nullCount = count(source.null, `columns[${index}].null`);
  if (total !== totalRows || valid + invalid + nullCount !== total) throw new Error(`Quality counts do not reconcile for ${source.field}`);
  const qualityPercent = Number(source.qualityPercent);
  const expectedQuality = total === 0 ? 0 : valid / total * 100;
  if (!Number.isFinite(qualityPercent) || Math.abs(qualityPercent - expectedQuality) > 1e-9) throw new Error(`Quality percentage mismatch for ${source.field}`);
  if (!Array.isArray(source.nullBreakdown) || source.nullBreakdown.length !== NULL_MARKERS.length) throw new Error(`Missing null marker breakdown for ${source.field}`);
  const nullBreakdown = source.nullBreakdown.map((value, markerIndex) => {
    const item = objectValue(value, `columns[${index}].nullBreakdown[${markerIndex}]`);
    if (item.marker !== NULL_MARKERS[markerIndex]) throw new Error(`Invalid null marker order for ${source.field}`);
    return { marker: item.marker as NullMarker, count: count(item.count, `${source.field}.${item.marker}`) };
  });
  if (nullBreakdown.reduce((sum, item) => sum + item.count, 0) !== nullCount) throw new Error(`Null markers do not reconcile for ${source.field}`);
  if (!Array.isArray(source.invalidBreakdown) || !Array.isArray(source.topValues)) throw new Error(`Quality details are missing for ${source.field}`);
  const invalidBreakdown = source.invalidBreakdown.map((value, detailIndex) => {
    const item = objectValue(value, `columns[${index}].invalidBreakdown[${detailIndex}]`);
    if (!Array.isArray(item.examples) || item.examples.some((example) => typeof example !== "string")) throw new Error(`Invalid examples for ${source.field}`);
    return { ruleId: text(item.ruleId, "ruleId"), description: text(item.description, "description"), count: count(item.count, "rule count"), examples: item.examples as string[] };
  });
  const topValues = source.topValues.map((value) => {
    const item = objectValue(value, "top value");
    return { value: text(item.value, "top value"), count: count(item.count, "top value count") };
  });
  return {
    field: source.field as string,
    label: text(source.label, `${source.field}.label`),
    dataType: source.dataType as QualityDataType,
    total, valid, invalid, null: nullCount, qualityPercent, nullBreakdown, invalidBreakdown,
    uniqueCount: count(source.uniqueCount, `${source.field}.uniqueCount`), topValues,
    ...(source.statistics ? { statistics: source.statistics as ColumnQualityReport["statistics"] } : {}),
  };
}

export function validateQualityReport(value: unknown): QualityReport {
  const source = objectValue(value, "quality report");
  if (source.schemaVersion !== "1.0.0") throw new Error("Unsupported quality schema version");
  const totalRows = count(source.totalRows, "quality totalRows");
  if (!Array.isArray(source.columns) || source.columns.length < 1 || source.columns.length > QUALITY_FIELDS.length) throw new Error("Quality report must contain canonical columns");
  let previousIndex = -1;
  const columns = source.columns.map((item, index) => {
    const column = validateColumn(item, index, totalRows);
    const canonicalIndex = QUALITY_FIELDS.indexOf(column.field as typeof QUALITY_FIELDS[number]);
    if (canonicalIndex <= previousIndex) throw new Error("Quality columns must use canonical order");
    previousIndex = canonicalIndex;
    return column;
  });
  return { schemaVersion: "1.0.0", totalRows, columns };
}

export async function fetchQualityReport(basePath = "", signal?: AbortSignal): Promise<QualityReport> {
  const response = await fetch(withBasePath("/data/quality.json", basePath), { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load data quality report (${response.status})`);
  return validateQualityReport(await response.json());
}
