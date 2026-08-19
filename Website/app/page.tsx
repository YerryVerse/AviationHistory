"use client";

import { Alert, Button, Skeleton } from "@mantine/core";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import DataQuality from "@/components/DataQuality";
import DataScienceView from "@/components/DataScienceView";
import GlobalFlightsView from "@/components/GlobalFlightsView";
import HistoricalStoryteller from "@/components/HistoricalStoryteller";
import KpiView from "@/components/KpiView";
import CommandShell, { type PortalView } from "@/components/shell/CommandShell";
import TableDataset from "@/components/TableDataset";
import { parseFilterSearch, serializeFilters } from "@/lib/staticData/filterUrl";
import { useAnalyticsData, type StaticView } from "@/lib/staticData/useAnalyticsData";


const VIEW_SLUGS: Record<StaticView, string> = {
  Overview: "overview",
  Geography: "geography",
  "Global Flights": "flights",
  Timeline: "timeline",
  Events: "events",
  "Data Science": "datascience",
  Quality: "quality",
  KPI: "kpi",
};

const TITLES: Record<StaticView, string> = {
  Overview: "Historical Overview",
  Geography: "Geographic Analysis",
  "Global Flights": "Global Commercial & Registered Flights",
  Timeline: "Historical Timeline",
  Events: "Events",
  "Data Science": "Data Science & Analytical Slicing",
  Quality: "Data Quality",
  KPI: "Key Performance Indicators (KPIs)",
};

function viewFromHash(hash: string): StaticView | null {
  const slug = hash.replace(/^#/, "");
  return (Object.entries(VIEW_SLUGS).find(([, value]) => value === slug)?.[0] as StaticView | undefined) ?? null;
}

export default function Page() {
  const data = useAnalyticsData();
  const { setView, updateFilters } = data;
  const [urlReady, setUrlReady] = useState(false);
  const manifestSubtitle = data.manifest
    ? `${data.manifest.total_rows.toLocaleString()} events · ${data.manifest.year_start}–${data.manifest.year_end}`
    : "Preparing validated manifest…";

  const navigateView = useCallback((view: PortalView) => {
    setView(view);
    window.history.pushState({ view }, "", `${window.location.pathname}${window.location.search}#${VIEW_SLUGS[view]}`);
  }, [setView]);

  useEffect(() => {
    const restore = () => {
      const restoredView = viewFromHash(window.location.hash);
      if (restoredView) setView(restoredView);
      updateFilters(parseFilterSearch(window.location.search, { yearStart: 1902, yearEnd: 2026 }));
      setUrlReady(true);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [setView, updateFilters]);

  useEffect(() => {
    if (!urlReady) return;
    const query = serializeFilters(data.filters);
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${query}#${VIEW_SLUGS[data.view]}`);
  }, [data.filters, data.view, urlReady]);

  const renderView = () => {
    if (data.view === "Global Flights") return <GlobalFlightsView />;
    if (data.view === "Timeline") return <HistoricalStoryteller events={data.events} snapshot={data.dashboard} />;
    if (data.view === "Events") return (
      <TableDataset
        events={data.events}
        page={data.page}
        onPageChange={data.setPage}
        loading={data.tableLoading}
        filterableFields={data.schemaFields.filter((field) => field !== "asn_id")}
        fieldFilters={data.eventFieldFilters}
        onFieldFiltersChange={data.setEventFieldFilters}
      />
    );
    if (data.view === "Data Science") return <DataScienceView filters={data.filters} />;
    if (data.view === "Quality") return <DataQuality />;
    if (data.view === "KPI") return <KpiView />;
    return <AnalyticsDashboard snapshot={data.dashboard} mode={data.view === "Geography" ? "geography" : "overview"} yearCount={data.manifest?.year_count ?? 125} />;
  };

  return (
    <CommandShell
      activeView={data.view}
      onNavigate={navigateView}
      title={TITLES[data.view]}
      subtitle={manifestSubtitle}
      datasetReady={Boolean(data.manifest && !data.error)}
    >
      <div className="portal-workspace">
        <div className="portal-content">
          {data.error ? (
            <Alert icon={<AlertTriangle size={18} />} color="red" title="The local dataset could not be queried" className="status-alert">
              {data.error} <Button variant="light" color="red" size="xs" ml="sm" onClick={data.retry}>Retry</Button>
            </Alert>
          ) : null}
          {data.loading ? (
            <div className="loading-dashboard" aria-live="polite"><p>Preparing local dataset…</p><Skeleton height={104} radius="md" /><Skeleton height={340} radius="md" /></div>
          ) : renderView()}
        </div>
      </div>
    </CommandShell>
  );
}
