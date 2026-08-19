import { describe, expect, it } from "vitest";

import {
  buildAnnualTrendQuery,
  buildCountryRankingQuery,
  buildDashboardQuery,
  buildDataScienceDistributionQuery,
  buildEventLookupQuery,
  buildEventsPageQuery,
  buildFilterOptionsQuery,
  buildMapPointsQuery,
  buildPhaseRankingQuery,
} from "./queries";


describe("parameterized analytics queries", () => {
  it("binds dashboard filters instead of interpolating values", () => {
    const query = buildDashboardQuery({
      yearStart: 1918,
      yearEnd: 1945,
      severity: "fatal",
      country: "Côte d'Ivoire",
      operator: "O'Hare Air",
      phaseGroup: "landing",
    });
    expect(query.text).not.toContain("Côte");
    expect(query.text).not.toContain("O'Hare");
    expect(query.params).toEqual([1918, 1945, "Côte d'Ivoire", "O'Hare Air", "landing"]);
    expect(query.text).toContain("fatalities_total > 0");
  });

  it("uses deterministic allowlisted sorting and bounded pagination", () => {
    const query = buildEventsPageQuery(
      { yearStart: 1902, yearEnd: 2026, severity: "all" },
      { sortBy: "event_date", sortDirection: "desc", limit: 50, offset: 100 },
    );
    expect(query.text).toContain('ORDER BY "event_date" DESC NULLS LAST, asn_id ASC');
    expect(query.text).toContain("CAST(event_date AS VARCHAR) AS event_date");
    expect(query.params.slice(-2)).toEqual([50, 100]);
    expect(() => buildEventsPageQuery(
      { yearStart: 1902, yearEnd: 2026, severity: "all" },
      { sortBy: "DROP TABLE events" as never, sortDirection: "asc", limit: 10, offset: 0 },
    )).toThrow("Unsupported sort field");
    expect(() => buildEventsPageQuery(
      { yearStart: 1902, yearEnd: 2026, severity: "all" },
      { sortBy: "asn_id", sortDirection: "asc", limit: 5001, offset: 0 },
    )).toThrow("limit");
  });

  it("binds events table field filters and blocks ASN ID filters", () => {
    const query = buildEventsPageQuery(
      { yearStart: 1902, yearEnd: 2026, severity: "all" },
      {
        sortBy: "event_date",
        sortDirection: "desc",
        limit: 50,
        offset: 0,
        fieldFilters: [{ field: "aircraft_manufacturer", value: "Boeing" }],
      },
    );
    expect(query.text).toContain('CAST("aircraft_manufacturer" AS VARCHAR) ILIKE ?');
    expect(query.params).toEqual([1902, 2026, "%Boeing%", 50, 0]);
    expect(() => buildEventsPageQuery(
      { yearStart: 1902, yearEnd: 2026, severity: "all" },
      { sortBy: "event_date", sortDirection: "desc", limit: 50, offset: 0, fieldFilters: [{ field: "asn_id", value: "42" }] },
    )).toThrow("ASN ID");
  });

  it("binds event lookup IDs", () => {
    expect(buildEventLookupQuery(80089)).toEqual({
      text: "SELECT * FROM selected_events WHERE asn_id = ? LIMIT 1",
      params: [80089],
    });
  });

  it("bounds filter options per dimension", () => {
    expect(buildFilterOptionsQuery().text).toContain("option_rank <= 200");
  });

  it("includes zero-occupant events in the occupant distribution", () => {
    const query = buildDataScienceDistributionQuery({
      yearStart: 1902,
      yearEnd: 2026,
      severity: "all",
    });

    expect(query.text).toContain("WHEN try_cast(occupants AS BIGINT) = 0 THEN '0'");
    expect(query.text).toContain("try_cast(occupants AS BIGINT) >= 0");
  });

  it("includes a bounded continent-to-country hierarchy for treemap drilldown", () => {
    const query = buildDataScienceDistributionQuery({
      yearStart: 1902,
      yearEnd: 2026,
      severity: "all",
    });

    expect(query.text).toContain("'continent_country'");
    expect(query.text).toContain("CAST(continent AS VARCHAR)");
    expect(query.text).toContain("CAST(country AS VARCHAR)");
    expect(query.text).toContain("'event_month_day', 'continent_country'");
  });

  it("builds bounded overview aggregates with shared parameterized filters", () => {
    const filters = { yearStart: 1910, yearEnd: 1920, severity: "fatal" as const, country: "France" };
    const annual = buildAnnualTrendQuery(filters);
    const phases = buildPhaseRankingQuery(filters);
    const countries = buildCountryRankingQuery(filters);
    const points = buildMapPointsQuery(filters);

    for (const query of [annual, phases, countries, points]) {
      expect(query.params.slice(0, 3)).toEqual([1910, 1920, "France"]);
      expect(query.text).not.toContain("France");
      expect(query.text).toContain("fatalities_total > 0");
    }
    expect(annual.text).toContain("GROUP BY event_year");
    expect(phases.text).toContain("LIMIT 10");
    expect(phases.text).toContain("GROUP BY 1");
    expect(countries.text).toContain("LIMIT 12");
    expect(countries.text).toContain("GROUP BY 1");
    expect(points.text).toContain("LIMIT 250");
    expect(points.text).toContain("gps_latitude IS NOT NULL");
  });
});
