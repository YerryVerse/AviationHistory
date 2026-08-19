import type { AnalyticsFilters, Severity } from "./types";


interface FilterBounds {
  yearStart: number;
  yearEnd: number;
}

const SEVERITIES = new Set<Severity>(["all", "fatal", "nonfatal"]);

function boundedYear(value: string | null, minimum: number, maximum: number): number | null {
  if (value === null || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= minimum && year <= maximum ? year : null;
}

function optionalText(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

export function parseFilterSearch(search: string, bounds: FilterBounds): AnalyticsFilters {
  const params = new URLSearchParams(search);
  const from = boundedYear(params.get("from"), bounds.yearStart, bounds.yearEnd);
  const to = boundedYear(params.get("to"), bounds.yearStart, bounds.yearEnd);
  const validRange = from !== null && to !== null && from <= to;
  const severityValue = params.get("severity") as Severity | null;
  const severity = severityValue && SEVERITIES.has(severityValue) ? severityValue : "all";
  return {
    yearStart: validRange ? from : bounds.yearStart,
    yearEnd: validRange ? to : bounds.yearEnd,
    severity,
    country: optionalText(params, "country"),
    operator: optionalText(params, "operator"),
    phaseGroup: optionalText(params, "phase"),
  };
}

export function serializeFilters(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();
  params.set("from", String(filters.yearStart));
  params.set("to", String(filters.yearEnd));
  if (filters.severity !== "all") params.set("severity", filters.severity);
  if (filters.country) params.set("country", filters.country);
  if (filters.operator) params.set("operator", filters.operator);
  if (filters.phaseGroup) params.set("phase", filters.phaseGroup);
  return params.toString();
}
