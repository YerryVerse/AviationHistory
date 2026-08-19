import { withBasePath } from "./basePath";
import type { DataAsset, DatasetManifest, QualityAsset, SummaryAsset, YearAsset } from "./types";


interface ManifestExpectations {
  yearStart: number;
  yearEnd: number;
  totalRows?: number;
  minTotalRows?: number;
}

const PRODUCTION_EXPECTATIONS: ManifestExpectations = {
  yearStart: 1902,
  yearEnd: 2026,
  minTotalRows: 395_000,
};
const SUMMARY_NAMES = new Set(["by_year", "by_year_country", "by_year_phase", "filter_options"]);


function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}


function integer(value: unknown, label: string, minimum = 0): number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    throw new Error(`${label} must be an integer >= ${minimum}`);
  }
  return value as number;
}


function asset(value: unknown, label: string): DataAsset {
  const item = objectValue(value, label);
  if (typeof item.path !== "string" || !item.path || item.path.startsWith("/") || item.path.includes("\\") || item.path.split("/").includes("..") || /^[a-z][a-z\d+.-]*:/i.test(item.path)) {
    throw new Error(`${label}.path must be a relative same-origin path`);
  }
  if (typeof item.sha256 !== "string" || !/^[a-f\d]{64}$/i.test(item.sha256)) {
    throw new Error(`${label}.sha256 must be a 64-character hexadecimal hash`);
  }
  return {
    path: item.path,
    rows: integer(item.rows, `${label}.rows`),
    bytes: integer(item.bytes, `${label}.bytes`, 1),
    sha256: item.sha256.toLowerCase(),
  };
}


export function validateManifest(
  value: unknown,
  expectations: ManifestExpectations = PRODUCTION_EXPECTATIONS,
): DatasetManifest {
  const source = objectValue(value, "manifest");
  if (source.schema_version !== "1.0.0") throw new Error("Unsupported manifest schema version");
  const analyticalFieldCount = integer(source.analytical_field_count, "analytical_field_count", 1);
  const fieldCount = integer(source.field_count, "field_count", 1);
  if (analyticalFieldCount > 90 || fieldCount < analyticalFieldCount) throw new Error("Manifest field count mismatch");
  const yearStart = integer(source.year_start, "year_start");
  const yearEnd = integer(source.year_end, "year_end");
  const totalRows = integer(source.total_rows, "total_rows");
  if (yearStart !== expectations.yearStart || yearEnd !== expectations.yearEnd) {
    throw new Error("Manifest coverage or total row count mismatch");
  }
  if (expectations.totalRows !== undefined && totalRows !== expectations.totalRows) {
    throw new Error("Manifest coverage or total row count mismatch");
  }
  if (expectations.minTotalRows !== undefined && totalRows < expectations.minTotalRows) {
    throw new Error("Manifest coverage or total row count mismatch");
  }
  if (!Array.isArray(source.years) || !Array.isArray(source.summaries)) throw new Error("Manifest asset registries must be arrays");
  const quality = asset(source.quality, "quality") as QualityAsset;
  if (quality.rows !== analyticalFieldCount || quality.path !== "quality.json") throw new Error("Manifest quality asset mismatch");
  const years: YearAsset[] = source.years.map((value, index) => {
    const item = objectValue(value, `years[${index}]`);
    return { ...asset(item, `years[${index}]`), year: integer(item.year, `years[${index}].year`) };
  });
  const expectedYears = Array.from({ length: yearEnd - yearStart + 1 }, (_, index) => yearStart + index);
  if (source.year_count !== expectedYears.length || years.length !== expectedYears.length || years.some((item, index) => item.year !== expectedYears[index])) {
    throw new Error("Manifest years must be unique, ordered, and contiguous");
  }
  if (years.reduce((sum, item) => sum + item.rows, 0) !== totalRows) throw new Error("Manifest year rows do not reconcile");
  const summaries: SummaryAsset[] = source.summaries.map((value, index) => {
    const item = objectValue(value, `summaries[${index}]`);
    if (typeof item.name !== "string" || !SUMMARY_NAMES.has(item.name)) throw new Error(`Unknown summary name: ${String(item.name)}`);
    return { ...asset(item, `summaries[${index}]`), name: item.name as SummaryAsset["name"] };
  });
  if (summaries.length !== SUMMARY_NAMES.size || new Set(summaries.map((item) => item.name)).size !== SUMMARY_NAMES.size) {
    throw new Error("Manifest must contain each summary asset exactly once");
  }
  return {
    schema_version: "1.0.0",
    analytical_field_count: analyticalFieldCount,
    field_count: fieldCount,
    year_start: yearStart,
    year_end: yearEnd,
    year_count: expectedYears.length,
    total_rows: totalRows,
    years,
    summaries,
    quality,
  };
}


export function getYearAssets(manifest: DatasetManifest, yearStart: number, yearEnd: number): YearAsset[] {
  if (yearStart > yearEnd || yearStart < manifest.year_start || yearEnd > manifest.year_end) {
    throw new Error(`Requested years ${yearStart}-${yearEnd} are outside manifest coverage`);
  }
  return manifest.years.slice(yearStart - manifest.year_start, yearEnd - manifest.year_start + 1);
}


export async function fetchManifest(basePath = "", signal?: AbortSignal): Promise<DatasetManifest> {
  const response = await fetch(withBasePath("/data/manifest.json", basePath), { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load dataset manifest (${response.status})`);
  return validateManifest(await response.json());
}
