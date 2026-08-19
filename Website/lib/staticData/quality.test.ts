import { describe, expect, it } from "vitest";

import { NULL_MARKERS, QUALITY_FIELDS, validateQualityReport } from "./quality";


function validReport() {
  return {
    schemaVersion: "1.0.0",
    totalRows: 10,
    columns: QUALITY_FIELDS.map((field, index) => ({
      field,
      label: field,
      dataType: index === 0 ? "integer" : "string",
      total: 10,
      valid: 8,
      invalid: 1,
      null: 1,
      qualityPercent: 80,
      nullBreakdown: NULL_MARKERS.map((marker) => ({ marker, count: marker === "database_null" ? 1 : 0 })),
      invalidBreakdown: [{ ruleId: `${field}_rule`, description: "Invalid value", count: 1, examples: ["bad"] }],
      uniqueCount: 8,
      topValues: [{ value: "sample", count: 2 }],
    })),
  };
}


describe("quality report validation", () => {
  it("accepts all reconciled published columns including dictionary aircraft fields", () => {
    const report = validateQualityReport(validReport());
    expect(report.columns).toHaveLength(QUALITY_FIELDS.length);
    expect(QUALITY_FIELDS).not.toContain("accident_investigation");
    expect(QUALITY_FIELDS).not.toContain("images");
    expect(QUALITY_FIELDS).toContain("aircraft_designation");
    expect(QUALITY_FIELDS).toContain("aircraft_common_name");
    expect(report.columns[0].field).toBe("asn_id");
    expect(report.columns[0].qualityPercent).toBe(80);
  });

  it("accepts a canonical subsequence after a field is intentionally removed", () => {
    const value = validReport();
    value.columns.splice(7, 1);
    const report = validateQualityReport(value);
    expect(report.columns).toHaveLength(QUALITY_FIELDS.length - 1);
    expect(report.columns.some((column) => column.field === "meta_keywords")).toBe(false);
  });

  it("rejects non-reconciling counts", () => {
    const report = validReport();
    report.columns[0].valid = 9;
    expect(() => validateQualityReport(report)).toThrow("do not reconcile");
  });

  it("rejects missing null markers and incorrect field order", () => {
    const missingMarker = validReport();
    missingMarker.columns[0].nullBreakdown.pop();
    expect(() => validateQualityReport(missingMarker)).toThrow("null marker");

    const wrongOrder = validReport();
    [wrongOrder.columns[0], wrongOrder.columns[1]] = [wrongOrder.columns[1], wrongOrder.columns[0]];
    expect(() => validateQualityReport(wrongOrder)).toThrow("canonical order");
  });
});
