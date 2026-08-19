// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";

import { aviationTheme } from "@/app/theme";
import KpiView from "./KpiView";

vi.mock("@/lib/staticData/quality", () => ({
  fetchQualityReport: vi.fn().mockResolvedValue({
    schemaVersion: "1.0.0",
    totalRows: 25420,
    columns: [
      {
        field: "asn_id",
        label: "Record ID",
        dataType: "integer",
        total: 25420,
        valid: 25420,
        invalid: 0,
        null: 0,
        qualityPercent: 100,
        nullBreakdown: [],
        invalidBreakdown: [],
        uniqueCount: 25420,
        topValues: [],
      },
    ],
  }),
}));

describe("KpiView component", () => {
  it("renders approved KPI cards and Field 1 ASN Record Identifier card", async () => {
    render(
      <MantineProvider theme={aviationTheme}>
        <KpiView />
      </MantineProvider>
    );

    expect(screen.getByText("Key Performance Indicators (KPI)")).toBeTruthy();
    expect((await screen.findAllByText("Data Quality")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Occurrence")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Timeline")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Severity")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Country")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Continent")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Propulsion")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Flight Phase")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Flight Nature")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Airframe Damage")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Aircraft Manufacturer")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Confidence")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Global Region")).length).toBeGreaterThan(0);
  });
});
