// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAnalyticsData } from "./useAnalyticsData";


const manifest = {
  schema_version: "1.0.0" as const,
  analytical_field_count: 82 as const,
  field_count: 86,
  year_start: 1902,
  year_end: 2026,
  year_count: 125,
  total_rows: 395_536,
  years: [],
  summaries: [],
  quality: { path: "quality.json", rows: 82 as const, bytes: 500, sha256: "a".repeat(64) },
};


function service() {
  return {
    manifest: vi.fn(async () => manifest),
    dashboard: vi.fn(async () => ({ eventCount: 10, fatalEventCount: 4, fatalitiesTotal: 12, annual: [], phases: [], countries: [], mapPoints: [], recent: [] })),
    events: vi.fn(async (_filters, page) => ({ rows: [], limit: page.limit, offset: page.offset })),
    filterOptions: vi.fn(async () => ({ values: [] })),
    schemaFields: vi.fn(async () => ["asn_id", "title", "aircraft_manufacturer"]),
  };
}


describe("useAnalyticsData", () => {
  it("loads manifest metadata and the initial bounded dashboard snapshot", async () => {
    const api = service();
    const { result } = renderHook(() => useAnalyticsData(api));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manifest?.total_rows).toBe(395_536);
    expect(result.current.dashboard?.eventCount).toBe(10);
    expect(api.dashboard).toHaveBeenCalledWith(expect.objectContaining({ yearStart: 1902, yearEnd: 2026 }), expect.any(AbortSignal));
    expect(api.dashboard).toHaveBeenCalledTimes(1);
  });

  it("runs view-specific paginated table queries", async () => {
    const api = service();
    const { result } = renderHook(() => useAnalyticsData(api));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setView("Events"));
    await waitFor(() => expect(api.events).toHaveBeenCalled());
    act(() => result.current.setPage(2));
    await waitFor(() => expect(api.events).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ offset: 50 }), expect.any(AbortSignal)));
  });

  it("passes events table field filters into paginated queries", async () => {
    const api = service();
    const { result } = renderHook(() => useAnalyticsData(api));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setView("Events"));
    act(() => result.current.setEventFieldFilters([{ field: "aircraft_manufacturer", value: "Boeing" }]));
    await waitFor(() => expect(api.events).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ fieldFilters: [{ field: "aircraft_manufacturer", value: "Boeing" }], offset: 0 }),
      expect.any(AbortSignal),
    ));
  });

  it.each(["Quality", "Data Transformation"] as const)("finishes loading when URL restoration updates filters on the %s view", async (view) => {
    const api = service();
    const { result } = renderHook(() => useAnalyticsData(api));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setView(view);
      result.current.updateFilters({ yearStart: 1902, yearEnd: 2026 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("surfaces errors and retries", async () => {
    const api = service();
    api.dashboard.mockRejectedValueOnce(new Error("query failed"));
    const { result } = renderHook(() => useAnalyticsData(api));
    await waitFor(() => expect(result.current.error).toBe("query failed"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(api.dashboard).toHaveBeenCalledTimes(2);
  });
});
