"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dataService } from "./dataService";
import type { AnalyticsFilters, DashboardSnapshot, DatasetManifest, EventFieldFilter, FilterOptions, PagedEvents } from "./types";


export type StaticView = "Overview" | "Geography" | "Global Flights" | "Timeline" | "Events" | "Data Science" | "Quality" | "KPI";

interface AnalyticsService {
  manifest(signal?: AbortSignal): Promise<DatasetManifest>;
  schemaFields(signal?: AbortSignal): Promise<string[]>;
  dashboard(filters: AnalyticsFilters, signal?: AbortSignal): Promise<DashboardSnapshot>;
  events(filters: AnalyticsFilters, page: { sortBy: "event_date"; sortDirection: "desc"; limit: number; offset: number; fieldFilters?: EventFieldFilter[] }, signal?: AbortSignal): Promise<PagedEvents>;
  filterOptions(signal?: AbortSignal): Promise<FilterOptions>;
}


export function useAnalyticsData(service: AnalyticsService = dataService) {
  const [view, setView] = useState<StaticView>("Overview");
  const [manifest, setManifest] = useState<DatasetManifest | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [events, setEvents] = useState<PagedEvents | null>(null);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [schemaFields, setSchemaFields] = useState<string[]>([]);
  const [eventFieldFilters, setEventFieldFiltersState] = useState<EventFieldFilter[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({ yearStart: 1902, yearEnd: 2026, severity: "all" });
  const [page, setPageState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const viewRef = useRef<StaticView>("Overview");
  const pageSize = 50;

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryToken((value) => value + 1);
  }, []);
  const selectView = useCallback((next: StaticView) => {
    viewRef.current = next;
    setLoading(next !== "Quality");
    setError(null);
    setView(next);
  }, []);
  const setPage = useCallback((value: number) => {
    setTableLoading(true);
    setPageState(Math.max(1, Math.floor(value)));
  }, []);
  const updateFilters = useCallback((next: Partial<AnalyticsFilters>) => {
    setLoading(viewRef.current !== "Quality");
    setError(null);
    setFilters((current) => ({ ...current, ...next }));
    setPageState(1);
  }, []);
  const setEventFieldFilters = useCallback((next: EventFieldFilter[]) => {
    setTableLoading(true);
    setError(null);
    setEventFieldFiltersState(next);
    setPageState(1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    Promise.all([service.manifest(controller.signal), service.filterOptions(controller.signal), service.schemaFields(controller.signal)])
      .then(([nextManifest, nextOptions, nextSchemaFields]) => {
        if (!current) return;
        setManifest(nextManifest);
        setOptions(nextOptions);
        setSchemaFields(nextSchemaFields);
      })
      .catch((reason: unknown) => {
        if (current && !controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [service]);

  const queryKey = useMemo(() => JSON.stringify(filters), [filters]);
  const eventFilterKey = useMemo(() => JSON.stringify(eventFieldFilters), [eventFieldFilters]);
  useEffect(() => {
    if (view === "Quality") {
      return;
    }
    const controller = new AbortController();
    let current = true;
    // General views use full dataset default parameters; Data Science view uses active slice filters
    const activeFilters = view === "Data Science" ? filters : { yearStart: 1902, yearEnd: 2026, severity: "all" as const };
    const request = view === "Events"
      ? service.events(activeFilters, { sortBy: "event_date", sortDirection: "desc", limit: pageSize, offset: (page - 1) * pageSize, fieldFilters: eventFieldFilters }, controller.signal)
          .then((result) => { if (current) setEvents(result); })
      : view === "Timeline"
        ? Promise.all([
            service.dashboard(activeFilters, controller.signal).then((result) => { if (current) setDashboard(result); }),
            service.events(activeFilters, { sortBy: "event_date", sortDirection: "desc", limit: 10, offset: 0 }, controller.signal).then((result) => { if (current) setEvents(result); }),
          ]).then(() => undefined)
        : service.dashboard(activeFilters, controller.signal)
          .then((result) => { if (current) setDashboard(result); });
    request
      .catch((reason: unknown) => {
        if (current && !controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        if (current) {
          setLoading(false);
          setTableLoading(false);
        }
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [eventFieldFilters, eventFilterKey, filters, page, queryKey, retryToken, service, view]);

  return {
    view, setView: selectView, manifest, dashboard, events, options, schemaFields, filters, updateFilters, eventFieldFilters, setEventFieldFilters,
    page, setPage, pageSize, loading, tableLoading, error, retry,
  };
}
