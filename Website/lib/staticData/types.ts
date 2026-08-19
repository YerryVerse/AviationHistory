export interface DataAsset {
  path: string;
  rows: number;
  bytes: number;
  sha256: string;
}

export interface YearAsset extends DataAsset {
  year: number;
}

export interface SummaryAsset extends DataAsset {
  name: "by_year" | "by_year_country" | "by_year_phase" | "filter_options";
}

export interface QualityAsset extends DataAsset {
  rows: number;
}

export interface DatasetManifest {
  schema_version: "1.0.0";
  analytical_field_count: number;
  field_count: number;
  year_start: number;
  year_end: number;
  year_count: number;
  total_rows: number;
  years: YearAsset[];
  summaries: SummaryAsset[];
  quality: QualityAsset;
}

export type Severity = "all" | "fatal" | "nonfatal";

export interface AnalyticsFilters {
  yearStart: number;
  yearEnd: number;
  severity: Severity;
  country?: string;
  operator?: string;
  phaseGroup?: string;
}

export interface EventFieldFilter {
  field: string;
  value: string;
}

export interface DashboardSnapshot {
  eventCount: number;
  fatalEventCount: number;
  fatalitiesTotal: number;
  annual: Array<{ year: number; events: number; fatalEvents: number }>;
  phases: Array<{ phase: string; events: number }>;
  countries: Array<{ country: string; events: number }>;
  mapPoints: Array<{ latitude: number; longitude: number; events: number }>;
  recent: EventRow[];
}

export interface DataScienceDistributionRow {
  fieldKey: string;
  value: string;
  fatal: number;
  nonFatal: number;
  total: number;
  distinctValues: number;
}

export interface DataScienceAircraftRateRow {
  label: string;
  designation: string;
  events: number;
  occupants: number;
  survivors: number;
}

export interface FilterOption {
  dimension: string;
  value: string;
  eventCount: number;
}

export interface FilterOptions {
  values: FilterOption[];
}

export interface EventRow {
  asn_id: number;
  event_date: string | null;
  event_year: number;
  title: string | null;
  country: string | null;
  operator: string | null;
  phase_group: string | null;
  fatalities_total: number | null;
  [key: string]: unknown;
}

export interface PagedEvents {
  rows: EventRow[];
  limit: number;
  offset: number;
}

export interface StorySnapshot {
  rows: EventRow[];
}

export interface QualitySnapshot {
  totalRows: number;
  rowsWithWarnings: number;
}

export type QualityDataType = "string" | "integer" | "float" | "date" | "json" | "string_list";
export type NullMarker = "database_null" | "blank" | "unknown" | "n/a" | "none" | "nan" | "undefined" | "dash";

export interface ColumnQualityReport {
  field: string;
  label: string;
  dataType: QualityDataType;
  total: number;
  valid: number;
  invalid: number;
  null: number;
  qualityPercent: number;
  nullBreakdown: Array<{ marker: NullMarker; count: number }>;
  invalidBreakdown: Array<{ ruleId: string; description: string; count: number; examples: string[] }>;
  uniqueCount: number;
  topValues: Array<{ value: string; count: number }>;
  statistics?: Record<string, string | number> & { kind: "numeric" | "text" | "date" | "list" };
}

export interface QualityReport {
  schemaVersion: "1.0.0";
  totalRows: number;
  columns: ColumnQualityReport[];
}

export interface SqlQuery {
  text: string;
  params: unknown[];
}
