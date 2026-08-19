import { describe, expect, it } from "vitest";

import { parseFilterSearch, serializeFilters } from "./filterUrl";


describe("filter URL state", () => {
  it("round trips supported filters", () => {
    const filters = {
      yearStart: 1914,
      yearEnd: 1945,
      severity: "fatal" as const,
      country: "France",
      operator: "Air Union",
      phaseGroup: "landing",
    };
    expect(parseFilterSearch(`?${serializeFilters(filters)}`, { yearStart: 1902, yearEnd: 2026 })).toEqual(filters);
  });

  it("ignores invalid values individually", () => {
    expect(parseFilterSearch("?from=nope&to=3000&severity=bad&country=Canada", { yearStart: 1902, yearEnd: 2026 })).toEqual({
      yearStart: 1902,
      yearEnd: 2026,
      severity: "all",
      country: "Canada",
    });
  });

  it("rejects reversed ranges", () => {
    expect(parseFilterSearch("?from=2020&to=1910", { yearStart: 1902, yearEnd: 2026 })).toEqual({
      yearStart: 1902,
      yearEnd: 2026,
      severity: "all",
    });
  });
});
