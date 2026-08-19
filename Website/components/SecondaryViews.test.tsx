// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";

import GlobalFlightsView from "./GlobalFlightsView";
import HistoricalStoryteller from "./HistoricalStoryteller";
import TableDataset from "./TableDataset";
import { aviationTheme } from "@/app/theme";


const event = { asn_id: 42, event_date: "1914-01-02", event_year: 1914, title: "Historical occurrence", country: "France", operator: "Test Air", phase_group: "Landing", fatalities_total: 1 };

describe("secondary command views", () => {
  it("renders timeline records in command panels", () => {
    const { container } = render(<HistoricalStoryteller events={{ rows: [event], limit: 10, offset: 0 }} />);
    expect(screen.getByRole("heading", { name: "Historical event timeline" })).toBeTruthy();
    expect(screen.getByText("Historical occurrence")).toBeTruthy();
    expect(container.querySelector(".command-panel")).toBeTruthy();
  });

  it("renders global flights view", () => {
    const { container } = render(
      <MantineProvider theme={aviationTheme}>
        <GlobalFlightsView />
      </MantineProvider>,
    );
    expect(container).toBeTruthy();
  });

  it("keeps bounded table pagination accessible", () => {
    const previous = vi.fn();
    const { container } = render(
      <MantineProvider theme={aviationTheme}>
        <TableDataset
          events={{ rows: [event], limit: 50, offset: 50 }}
          page={2}
          onPageChange={previous}
          filterableFields={["title", "country"]}
          fieldFilters={[]}
          onFieldFiltersChange={vi.fn()}
        />
      </MantineProvider>,
    );
    expect(container.querySelector(".command-table")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(previous).toHaveBeenCalledWith(1);
  });

  it("adds field filters without exposing ASN ID", () => {
    const onFieldFiltersChange = vi.fn();
    render(
      <MantineProvider theme={aviationTheme}>
        <TableDataset
          events={{ rows: [event], limit: 50, offset: 0 }}
          page={1}
          onPageChange={vi.fn()}
          filterableFields={["title", "country"]}
          fieldFilters={[]}
          onFieldFiltersChange={onFieldFiltersChange}
        />
      </MantineProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
    expect(onFieldFiltersChange).toHaveBeenCalledWith([{ field: "title", value: "" }]);
    expect(screen.queryByText("ASN ID")).toBeTruthy();
    expect(screen.queryByRole("option", { name: /ASN ID/i })).toBeNull();
  });

});
