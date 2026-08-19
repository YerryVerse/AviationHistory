// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it } from "vitest";

import AnalyticsDashboard from "./AnalyticsDashboard";
import { aviationTheme } from "@/app/theme";


const snapshot = {
  eventCount: 395_536,
  fatalEventCount: 28_412,
  fatalitiesTotal: 186_907,
  annual: [{ year: 1902, events: 6, fatalEvents: 1 }, { year: 1903, events: 11, fatalEvents: 2 }],
  phases: [{ phase: "Landing", events: 120 }, { phase: "Takeoff", events: 90 }],
  countries: [{ country: "United States", events: 146_882 }, { country: "France", events: 15_948 }],
  mapPoints: [{ latitude: 40.7, longitude: -74, events: 230 }],
  recent: [{ asn_id: 80089, event_date: "2026-06-18", event_year: 2026, title: "Test occurrence", country: "United States", operator: null, phase_group: "Landing", fatalities_total: 0 }],
};

describe("command overview", () => {
  it("renders the approved analytical reading path", () => {
    render(<MantineProvider theme={aviationTheme}><AnalyticsDashboard snapshot={snapshot} mode="overview" yearCount={125} /></MantineProvider>);
    expect(screen.getByText("395,536")).toBeTruthy();
    expect(screen.getByText("125 years")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Events through time" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Geographic signal" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phase" })).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();
    expect(screen.getByText("Test occurrence")).toBeTruthy();
    expect(screen.getByText("Annual event data")).toBeTruthy();
    expect(document.querySelector(".visually-hidden")?.tagName).toBe("DIV");
  });

  it("prioritizes the geographic panel in geography mode", () => {
    render(<MantineProvider theme={aviationTheme}><AnalyticsDashboard snapshot={snapshot} mode="geography" yearCount={125} /></MantineProvider>);
    expect(screen.getByTestId("geography-dashboard")).toBeTruthy();
    expect(screen.getByText("Geographic event concentrations")).toBeTruthy();
  });
});
