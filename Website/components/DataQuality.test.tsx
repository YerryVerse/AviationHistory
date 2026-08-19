// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QualityReportView } from "./DataQuality";
import type { ColumnQualityReport, QualityReport } from "@/lib/staticData/types";


function column(field: string, qualityPercent: number): ColumnQualityReport {
  const total = 100;
  const valid = qualityPercent;
  return {
    field, label: field.toUpperCase(), dataType: "string", total, valid, invalid: 5, null: total - valid - 5, qualityPercent,
    nullBreakdown: [
      { marker: "database_null", count: total - valid - 5 }, { marker: "blank", count: 0 }, { marker: "unknown", count: 0 },
      { marker: "n/a", count: 0 }, { marker: "none", count: 0 }, { marker: "nan", count: 0 }, { marker: "undefined", count: 0 }, { marker: "dash", count: 0 },
    ],
    invalidBreakdown: [{ ruleId: `${field}_rule`, description: "Invalid format", count: 5, examples: ["bad value"] }],
    uniqueCount: 10,
    topValues: [{ value: "common", count: 20 }],
    statistics: { kind: "text", minLength: 2, maxLength: 30, averageLength: 12 },
  };
}

const report: QualityReport = {
  schemaVersion: "1.0.0",
  totalRows: 100,
  columns: [column("green", 100), column("blue", 90), column("orange", 70), column("red", 50)],
};


describe("QualityReportView", () => {
  it("renders the five sortable columns in descending quality order", () => {
    render(<QualityReportView report={report} defaultHidePerfect={false} />);
    for (const name of ["Column", "Valid", "Invalid", "Null", "Quality %"]) expect(screen.getByRole("button", { name: new RegExp(`Sort by ${name}`, "i") })).toBeTruthy();
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual(["GREENgreen", "BLUEblue", "ORANGEorange", "REDred"]);
  });

  it("sorts every numeric column and updates selected-column details", () => {
    render(<QualityReportView report={report} defaultHidePerfect={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Sort by Null/i }));
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(within(rows[0]).getAllByRole("cell")[0].textContent).toContain("RED");

    fireEvent.click(screen.getByRole("button", { name: /Select RED/i }));
    expect(screen.getByRole("heading", { name: "RED" })).toBeTruthy();
    expect(screen.getByText("Invalid format")).toBeTruthy();
    expect(screen.getByText("bad value")).toBeTruthy();
    expect(screen.getByText("Database null")).toBeTruthy();
  });

  it("applies the exact quality color boundaries", () => {
    render(<QualityReportView report={report} defaultHidePerfect={false} />);
    expect(screen.getByTestId("quality-score-green").className).toContain("quality-perfect");
    expect(screen.getByTestId("quality-score-blue").className).toContain("quality-good");
    expect(screen.getByTestId("quality-score-orange").className).toContain("quality-warning");
    expect(screen.getByTestId("quality-score-red").className).toContain("quality-critical");
  });

  it("does not display a rounded non-perfect score as 100 percent", () => {
    const nearPerfect = { ...report, columns: [column("almost", 99.99)] };
    nearPerfect.columns[0].valid = 99.99;
    render(<QualityReportView report={nearPerfect as QualityReport} />);
    expect(screen.getAllByText("99.9%").length).toBeGreaterThan(0);
  });
});
