import { describe, expect, it } from "vitest";

import { getYearAssets, validateManifest } from "./manifest";


function validManifest() {
  return {
    schema_version: "1.0.0",
    analytical_field_count: 82,
    field_count: 86,
    year_start: 1902,
    year_end: 1903,
    year_count: 2,
    total_rows: 3,
    years: [
      { year: 1902, path: "events/year=1902/events.parquet", rows: 2, bytes: 100, sha256: "a".repeat(64) },
      { year: 1903, path: "events/year=1903/events.parquet", rows: 1, bytes: 90, sha256: "b".repeat(64) },
    ],
    summaries: [
      { name: "by_year", path: "summaries/by_year.parquet", rows: 2, bytes: 50, sha256: "c".repeat(64) },
      { name: "by_year_country", path: "summaries/by_year_country.parquet", rows: 2, bytes: 50, sha256: "d".repeat(64) },
      { name: "by_year_phase", path: "summaries/by_year_phase.parquet", rows: 2, bytes: 50, sha256: "e".repeat(64) },
      { name: "filter_options", path: "summaries/filter_options.parquet", rows: 2, bytes: 50, sha256: "f".repeat(64) },
    ],
    quality: { path: "quality.json", rows: 82, bytes: 500, sha256: "1".repeat(64) },
  };
}


describe("manifest validation", () => {
  it("accepts exact coverage, counts, hashes, and relative same-origin assets", () => {
    const manifest = validateManifest(validManifest(), { yearStart: 1902, yearEnd: 1903, totalRows: 3 });
    expect(manifest.years).toHaveLength(2);
    expect(manifest.quality.rows).toBe(82);
    expect(getYearAssets(manifest, 1902, 1903).map((asset) => asset.year)).toEqual([1902, 1903]);
  });

  it("accepts internally consistent reduced field counts", () => {
    const value = validManifest();
    value.analytical_field_count = 81;
    value.field_count = 85;
    value.quality.rows = 81;
    const manifest = validateManifest(value, { yearStart: 1902, yearEnd: 1903, totalRows: 3 });
    expect(manifest.field_count).toBe(85);
    expect(manifest.quality.rows).toBe(81);
  });

  it.each([
    ["schema", (value: ReturnType<typeof validManifest>) => { value.schema_version = "2.0.0"; }],
    ["count", (value: ReturnType<typeof validManifest>) => { value.total_rows = 4; }],
    ["duplicate", (value: ReturnType<typeof validManifest>) => { value.years[1].year = 1902; }],
    ["absolute", (value: ReturnType<typeof validManifest>) => { value.years[0].path = "https://evil.example/data.parquet"; }],
    ["traversal", (value: ReturnType<typeof validManifest>) => { value.years[0].path = "../secret"; }],
    ["size", (value: ReturnType<typeof validManifest>) => { value.years[0].bytes = 0; }],
    ["hash", (value: ReturnType<typeof validManifest>) => { value.years[0].sha256 = "bad"; }],
  ])("rejects malformed %s metadata", (_name, mutate) => {
    const value = validManifest();
    mutate(value);
    expect(() => validateManifest(value, { yearStart: 1902, yearEnd: 1903, totalRows: 3 })).toThrow();
  });

  it("rejects unknown requested years", () => {
    const manifest = validateManifest(validManifest(), { yearStart: 1902, yearEnd: 1903, totalRows: 3 });
    expect(() => getYearAssets(manifest, 1901, 1902)).toThrow("outside manifest coverage");
  });
});
