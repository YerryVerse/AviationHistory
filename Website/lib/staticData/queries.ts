import type { AnalyticsFilters, EventFieldFilter, SqlQuery } from "./types";


export type EventSortField = "asn_id" | "event_date" | "event_year" | "fatalities_total" | "country" | "operator";
export interface PageOptions {
  sortBy: EventSortField;
  sortDirection: "asc" | "desc";
  limit: number;
  offset: number;
  fieldFilters?: EventFieldFilter[];
}

const SORT_FIELDS = new Set<EventSortField>(["asn_id", "event_date", "event_year", "fatalities_total", "country", "operator"]);
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const DATA_SCIENCE_FIELDS = [
  "event_year", "event_month", "event_day", "event_weekday", "local_time",
  "aircraft_type", "aircraft_manufacturer", "aircraft_name", "aircraft_model",
  "aircraft_variant", "aircraft_designation", "aircraft_common_name",
  "year_of_manufacture", "engine_model", "total_airframe_hrs",
  "operator", "nature", "phase", "phase_group", "confidence_rating", "category",
  "icao_occurrence_category", "aircraft_damage", "aircraft_disposition", "occupants",
  "fatalities_onboard", "survivors_onboard", "fatalities_ground",
  "survival_rate_onboard", "fatality_rate_onboard", "country", "location",
  "continent", "region", "departure_airport", "departure_iata",
  "destination_airport", "destination_iata",
  "weather_or_visibility_mentioned", "investigating_agency",
  "accident_investigation_duration", "accident_investigation_status",
] as const;


function filterClause(filters: AnalyticsFilters): { clauses: string[]; params: unknown[] } {
  if (!Number.isInteger(filters.yearStart) || !Number.isInteger(filters.yearEnd) || filters.yearStart > filters.yearEnd) {
    throw new Error("Invalid year range");
  }
  const clauses = ["event_year BETWEEN ? AND ?"];
  const params: unknown[] = [filters.yearStart, filters.yearEnd];
  if (filters.severity === "fatal") clauses.push("fatalities_total > 0");
  else if (filters.severity === "nonfatal") clauses.push("coalesce(fatalities_total, 0) = 0");
  else if (filters.severity !== "all") throw new Error("Unsupported severity filter");
  for (const [column, value] of [["country", filters.country], ["operator", filters.operator], ["phase_group", filters.phaseGroup]] as const) {
    if (value) {
      clauses.push(`"${column}" = ?`);
      params.push(value);
    }
  }
  return { clauses, params };
}


function eventFieldFilterClause(fieldFilters: EventFieldFilter[] | undefined): { clauses: string[]; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const filter of fieldFilters ?? []) {
    const field = filter.field.trim();
    const value = filter.value.trim();
    if (!field || !value) continue;
    if (field === "asn_id") throw new Error("ASN ID cannot be used as an event table field filter");
    if (!SAFE_IDENTIFIER.test(field)) throw new Error(`Unsupported event table field filter: ${field}`);
    clauses.push(`CAST("${field}" AS VARCHAR) ILIKE ?`);
    params.push(`%${value}%`);
  }
  return { clauses, params };
}


export function buildDashboardQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause(filters);
  return {
    text: `SELECT count(*)::BIGINT AS event_count, count(*) FILTER (WHERE fatalities_total > 0)::BIGINT AS fatal_event_count, coalesce(sum(fatalities_total), 0)::BIGINT AS fatalities_total FROM selected_events WHERE ${clauses.join(" AND ")}`,
    params,
  };
}

export function buildDataScienceDistributionQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause({ ...filters, severity: "all" });
  const distributions = DATA_SCIENCE_FIELDS.map((field) => `
    SELECT
      '${field}' AS field_key,
      coalesce(nullif(trim(CAST("${field}" AS VARCHAR)), ''), 'Not Recorded') AS value,
      count(*)::BIGINT AS total,
      count(*) FILTER (WHERE coalesce(try_cast(fatalities_total AS BIGINT), 0) > 0)::BIGINT AS fatal,
      count(*) FILTER (WHERE coalesce(try_cast(fatalities_total AS BIGINT), 0) = 0)::BIGINT AS non_fatal
    FROM selected_events
    WHERE ${clauses.join(" AND ")}
    GROUP BY 2
  `);
  const derivedDistributions = [
    {
      fieldKey: "event_month_day",
      expression: "lpad(CAST(try_cast(event_month AS INTEGER) AS VARCHAR), 2, '0') || '-' || lpad(CAST(try_cast(event_day AS INTEGER) AS VARCHAR), 2, '0')",
      predicate: "try_cast(event_month AS INTEGER) BETWEEN 1 AND 12 AND try_cast(event_day AS INTEGER) BETWEEN 1 AND 31",
      fatalPredicate: "coalesce(try_cast(fatalities_total AS BIGINT), 0) > 0",
    },
    {
      fieldKey: "continent_country",
      expression: "coalesce(nullif(trim(CAST(continent AS VARCHAR)), ''), 'Not Recorded') || '|||' || coalesce(nullif(trim(CAST(country AS VARCHAR)), ''), 'Not Recorded')",
      predicate: "TRUE",
      fatalPredicate: "coalesce(try_cast(fatalities_total AS BIGINT), 0) > 0",
    },
    {
      fieldKey: "occupants_bands",
      expression: `CASE
        WHEN try_cast(occupants AS BIGINT) = 0 THEN '0'
        WHEN try_cast(occupants AS BIGINT) = 1 THEN '1'
        WHEN try_cast(occupants AS BIGINT) = 2 THEN '2'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 3 AND 4 THEN '3–4'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 5 AND 6 THEN '5–6'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 7 AND 9 THEN '7–9'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 10 AND 19 THEN '10–19'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 20 AND 29 THEN '20–29'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 30 AND 49 THEN '30–49'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 50 AND 69 THEN '50–69'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 70 AND 89 THEN '70–89'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 90 AND 119 THEN '90–119'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 120 AND 149 THEN '120–149'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 150 AND 179 THEN '150–179'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 180 AND 219 THEN '180–219'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 220 AND 279 THEN '220–279'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 280 AND 349 THEN '280–349'
        WHEN try_cast(occupants AS BIGINT) BETWEEN 350 AND 449 THEN '350–449'
        WHEN try_cast(occupants AS BIGINT) >= 450 THEN '450+'
      END`,
      predicate: "try_cast(occupants AS BIGINT) >= 0",
      fatalPredicate: "coalesce(try_cast(fatalities_total AS BIGINT), 0) > 0",
    },
    {
      fieldKey: "fatalities_onboard_bands",
      expression: `CASE
        WHEN try_cast(fatalities_onboard AS BIGINT) = 0 THEN '0'
        WHEN try_cast(fatalities_onboard AS BIGINT) = 1 THEN '1'
        WHEN try_cast(fatalities_onboard AS BIGINT) = 2 THEN '2'
        WHEN try_cast(fatalities_onboard AS BIGINT) = 3 THEN '3'
        WHEN try_cast(fatalities_onboard AS BIGINT) BETWEEN 4 AND 5 THEN '4–5'
        WHEN try_cast(fatalities_onboard AS BIGINT) BETWEEN 6 AND 10 THEN '6–10'
        WHEN try_cast(fatalities_onboard AS BIGINT) BETWEEN 11 AND 50 THEN '11–50'
        WHEN try_cast(fatalities_onboard AS BIGINT) BETWEEN 51 AND 100 THEN '51–100'
        WHEN try_cast(fatalities_onboard AS BIGINT) >= 101 THEN '101+'
      END`,
      predicate: "try_cast(fatalities_onboard AS BIGINT) >= 0",
      fatalPredicate: "try_cast(fatalities_onboard AS BIGINT) > 0 AND coalesce(try_cast(survivors_onboard AS BIGINT), 0) = 0",
    },
    {
      fieldKey: "survivors_onboard_bands",
      expression: `CASE
        WHEN try_cast(survivors_onboard AS BIGINT) = 0 THEN '0'
        WHEN try_cast(survivors_onboard AS BIGINT) = 1 THEN '1'
        WHEN try_cast(survivors_onboard AS BIGINT) = 2 THEN '2'
        WHEN try_cast(survivors_onboard AS BIGINT) = 3 THEN '3'
        WHEN try_cast(survivors_onboard AS BIGINT) BETWEEN 4 AND 5 THEN '4–5'
        WHEN try_cast(survivors_onboard AS BIGINT) BETWEEN 6 AND 10 THEN '6–10'
        WHEN try_cast(survivors_onboard AS BIGINT) BETWEEN 11 AND 50 THEN '11–50'
        WHEN try_cast(survivors_onboard AS BIGINT) BETWEEN 51 AND 100 THEN '51–100'
        WHEN try_cast(survivors_onboard AS BIGINT) BETWEEN 101 AND 499 THEN '101–499'
        WHEN try_cast(survivors_onboard AS BIGINT) >= 500 THEN '500+'
      END`,
      predicate: "try_cast(survivors_onboard AS BIGINT) >= 0",
      fatalPredicate: "coalesce(try_cast(fatalities_total AS BIGINT), 0) > 0",
    },
    {
      fieldKey: "fatalities_ground_bands",
      expression: `CASE
        WHEN try_cast(fatalities_ground AS BIGINT) = 0 THEN '0'
        WHEN try_cast(fatalities_ground AS BIGINT) = 1 THEN '1'
        WHEN try_cast(fatalities_ground AS BIGINT) = 2 THEN '2'
        WHEN try_cast(fatalities_ground AS BIGINT) = 3 THEN '3'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 4 AND 5 THEN '4–5'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 6 AND 10 THEN '6–10'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 11 AND 50 THEN '11–50'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 51 AND 100 THEN '51–100'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 101 AND 499 THEN '101–499'
        WHEN try_cast(fatalities_ground AS BIGINT) BETWEEN 500 AND 999 THEN '500–999'
        WHEN try_cast(fatalities_ground AS BIGINT) >= 1000 THEN '1,000+'
      END`,
      predicate: "try_cast(fatalities_ground AS BIGINT) >= 0",
      fatalPredicate: "try_cast(fatalities_ground AS BIGINT) > 0 AND coalesce(try_cast(survivors_onboard AS BIGINT), 0) = 0",
    },
  ].map(({ fieldKey, expression, predicate, fatalPredicate }) => `
    SELECT
      '${fieldKey}' AS field_key,
      ${expression} AS value,
      count(*)::BIGINT AS total,
      count(*) FILTER (WHERE ${fatalPredicate})::BIGINT AS fatal,
      count(*) FILTER (WHERE NOT (${fatalPredicate}))::BIGINT AS non_fatal
    FROM selected_events
    WHERE ${clauses.join(" AND ")} AND ${predicate}
    GROUP BY 2
  `);
  const allDistributions = [...distributions, ...derivedDistributions];

  return {
    text: `
      WITH distributions AS (
        ${allDistributions.join(" UNION ALL ")}
      ),
      ranked AS (
        SELECT
          *,
          count(*) OVER (PARTITION BY field_key)::BIGINT AS distinct_values,
          row_number() OVER (PARTITION BY field_key ORDER BY total DESC, value ASC) AS value_rank
        FROM distributions
      )
      SELECT field_key, value, fatal, non_fatal, total, distinct_values
      FROM ranked
      WHERE value_rank <= CASE
        WHEN field_key IN ('event_month_day', 'continent_country') THEN 400
        ELSE 100
      END
      ORDER BY field_key, value_rank
    `,
    params: allDistributions.flatMap(() => params),
  };
}

export function buildDataScienceAircraftRateQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause({ ...filters, severity: "all" });
  return {
    text: `
      SELECT
        concat(trim(aircraft_manufacturer), ' ', trim(aircraft_model)) AS label,
        coalesce(nullif(trim(max(aircraft_designation)), ''), 'Civil') AS designation,
        count(*)::BIGINT AS events,
        sum(try_cast(occupants AS BIGINT))::BIGINT AS occupants,
        sum(try_cast(survivors_onboard AS BIGINT))::BIGINT AS survivors
      FROM selected_events
      WHERE ${clauses.join(" AND ")}
        AND nullif(trim(aircraft_manufacturer), '') IS NOT NULL
        AND nullif(trim(aircraft_model), '') IS NOT NULL
        AND trim(aircraft_manufacturer) <> 'Not Recorded'
        AND trim(aircraft_model) <> 'Not Recorded'
        AND try_cast(occupants AS BIGINT) > 0
        AND try_cast(survivors_onboard AS BIGINT) BETWEEN 0 AND try_cast(occupants AS BIGINT)
      GROUP BY 1
      HAVING sum(try_cast(occupants AS BIGINT)) > 0
      ORDER BY events DESC, label ASC
      LIMIT 100
    `,
    params,
  };
}


export function buildAnnualTrendQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause(filters);
  return {
    text: `SELECT event_year, count(*)::BIGINT AS events, count(*) FILTER (WHERE fatalities_total > 0)::BIGINT AS fatal_events FROM selected_events WHERE ${clauses.join(" AND ")} GROUP BY event_year ORDER BY event_year`,
    params,
  };
}


export function buildPhaseRankingQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause(filters);
  return {
    text: `SELECT coalesce(nullif(trim(phase_group), ''), 'Unknown') AS phase, count(*)::BIGINT AS events FROM selected_events WHERE ${clauses.join(" AND ")} GROUP BY 1 ORDER BY events DESC, 1 LIMIT 10`,
    params,
  };
}


export function buildCountryRankingQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause(filters);
  return {
    text: `SELECT coalesce(nullif(trim(country), ''), 'Unknown') AS country, count(*)::BIGINT AS events FROM selected_events WHERE ${clauses.join(" AND ")} GROUP BY 1 ORDER BY events DESC, 1 LIMIT 12`,
    params,
  };
}


export function buildMapPointsQuery(filters: AnalyticsFilters): SqlQuery {
  const { clauses, params } = filterClause(filters);
  return {
    text: `SELECT round(gps_latitude, 1) AS latitude, round(gps_longitude, 1) AS longitude, count(*)::BIGINT AS events FROM selected_events WHERE ${clauses.join(" AND ")} AND gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL AND gps_latitude BETWEEN -90 AND 90 AND gps_longitude BETWEEN -180 AND 180 GROUP BY latitude, longitude ORDER BY events DESC LIMIT 250`,
    params,
  };
}


export function buildEventsPageQuery(filters: AnalyticsFilters, page: PageOptions): SqlQuery {
  if (!SORT_FIELDS.has(page.sortBy)) throw new Error(`Unsupported sort field: ${page.sortBy}`);
  if (page.sortDirection !== "asc" && page.sortDirection !== "desc") throw new Error("Unsupported sort direction");
  if (!Number.isInteger(page.limit) || page.limit < 1 || page.limit > 500) throw new Error("Page limit must be between 1 and 500");
  if (!Number.isInteger(page.offset) || page.offset < 0) throw new Error("Page offset must be non-negative");
  const { clauses, params } = filterClause(filters);
  const eventFieldFilters = eventFieldFilterClause(page.fieldFilters);
  clauses.push(...eventFieldFilters.clauses);
  params.push(...eventFieldFilters.params);
  params.push(page.limit, page.offset);
  return {
    text: `SELECT asn_id, CAST(event_date AS VARCHAR) AS event_date, event_year, title, country, operator, phase_group, fatalities_total FROM selected_events WHERE ${clauses.join(" AND ")} ORDER BY "${page.sortBy}" ${page.sortDirection.toUpperCase()} NULLS LAST, asn_id ASC LIMIT ? OFFSET ?`,
    params,
  };
}


export function buildEventLookupQuery(asnId: number): SqlQuery {
  if (!Number.isSafeInteger(asnId) || asnId <= 0) throw new Error("ASN ID must be a positive integer");
  return { text: "SELECT * FROM selected_events WHERE asn_id = ? LIMIT 1", params: [asnId] };
}


export function buildFilterOptionsQuery(): SqlQuery {
  return {
    text: "SELECT dimension, value, event_count FROM (SELECT dimension, value, event_count, row_number() OVER (PARTITION BY dimension ORDER BY event_count DESC, value) AS option_rank FROM filter_options) ranked_options WHERE option_rank <= 200 ORDER BY dimension, event_count DESC, value",
    params: [],
  };
}
