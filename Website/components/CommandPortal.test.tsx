// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";

import { aviationTheme } from "@/app/theme";
import FilterCommandBar from "./filters/FilterCommandBar";
import CommandShell from "./shell/CommandShell";


describe("command portal chrome", () => {
  it("renders the approved navigation and dataset status", () => {
    render(
      <MantineProvider theme={aviationTheme}>
        <CommandShell
          activeView="Overview"
          onNavigate={vi.fn()}
          title="Historical Overview"
          subtitle="395,536 events · 1902–2026"
          datasetReady
        >
          <div>Dashboard body</div>
        </CommandShell>
      </MantineProvider>,
    );
    for (const label of ["Overview", "Geography", "Timeline", "Events", "Data Science", "Quality", "KPI"]) {
      expect(screen.getAllByRole("button", { name: label }).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Dataset ready")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Toggle color scheme" }).length).toBeGreaterThan(0);
  });

  it("renders all shared filters and reset action", () => {
    render(
      <MantineProvider theme={aviationTheme}>
        <FilterCommandBar
          filters={{ yearStart: 1902, yearEnd: 2026, severity: "all" }}
          options={[]}
          onChange={vi.fn()}
          onReset={vi.fn()}
          onShare={vi.fn()}
        />
      </MantineProvider>,
    );
    expect(screen.getByRole("textbox", { name: "From year" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "To year" })).toBeTruthy();
    for (const label of ["Severity", "Country", "Operator", "Flight phase"]) expect(screen.getByRole("combobox", { name: label })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open filters" })).toBeTruthy();
  });
});
