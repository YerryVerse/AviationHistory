"use client";

import AnnualTrendChart from "@/components/charts/AnnualTrendChart";
import PhaseChart from "@/components/charts/PhaseChart";
import EventMap from "@/components/maps/EventMap";
import type { DashboardSnapshot } from "@/lib/staticData/types";

interface AnalyticsDashboardProps {
  snapshot: DashboardSnapshot | null;
  mode?: "overview" | "geography";
  yearCount?: number;
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="panel-heading">
      <div>
        <h2 className="panel-title">{title}</h2>
        <p className="panel-subtitle">{subtitle}</p>
      </div>
    </header>
  );
}

function CountryRanking({ countries }: { countries: DashboardSnapshot["countries"] }) {
  return (
    <div>
      {countries.slice(0, 6).map((item, index) => (
        <div className="rank-row" key={item.country}>
          <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{item.country}</span>
          <span className="rank-value">{item.events.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ snapshot, mode = "overview", yearCount = 125 }: AnalyticsDashboardProps) {
  if (!snapshot) return <div className="status-state">No analytical snapshot is available.</div>;

  const metrics = [
    { label: "Total events", value: snapshot.eventCount.toLocaleString(), note: "Events in current dataset selection", className: "" },
    {
      label: "Fatal events",
      value: snapshot.fatalEventCount.toLocaleString(),
      note: `${snapshot.eventCount ? ((snapshot.fatalEventCount / snapshot.eventCount) * 100).toFixed(1) : "0.0"}% of total events`,
      className: "fatal",
    },
    { label: "Fatalities", value: snapshot.fatalitiesTotal.toLocaleString(), note: "Recorded onboard and ground", className: "" },
    { label: "Coverage", value: `${yearCount} years`, note: "1902 through 2026", className: "accent" },
  ];

  if (mode === "geography") {
    return (
      <section data-testid="geography-dashboard">
        <div className="command-panel">
          <PanelHeading title="Geographic event concentrations" subtitle="Bounded coordinate aggregates from global dataset" />
          <EventMap points={snapshot.mapPoints} />
          <div className="map-fallback">
            <PanelHeading title="Leading countries" subtitle="Accessible geographic ranking" />
            <CountryRanking countries={snapshot.countries} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Aviation safety summary" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="metric-strip-card">
        <div className="metric-strip">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p className="metric-label">{metric.label}</p>
              <p className={`metric-value ${metric.className}`}>{metric.value}</p>
              <p className="metric-note">{metric.note}</p>
            </article>
          ))}
        </div>
        <footer className="metric-strip-footer">Static data updated from February 1902 to July 2026</footer>
      </div>

      <div className="overview-grid">
        <article className="command-panel">
          <PanelHeading title="Events through time" subtitle="Annual occurrence volume and fatal outcomes" />
          <AnnualTrendChart data={snapshot.annual} />
        </article>
        <article className="command-panel">
          <PanelHeading title="Geographic signal" subtitle="Event concentration by recorded coordinates" />
          <EventMap points={snapshot.mapPoints} />
        </article>
      </div>

      <div className="overview-lower">
        <article className="command-panel">
          <PanelHeading title="Phase" subtitle="Most frequently recorded operational phases" />
          <PhaseChart data={snapshot.phases} />
        </article>
        <article className="command-panel">
          <PanelHeading title="Leading countries" subtitle="By event count in full dataset" />
          <CountryRanking countries={snapshot.countries} />
        </article>
        <article className="command-panel">
          <PanelHeading title="Recent records" subtitle="Latest historical events" />
          <ul className="recent-list">
            {snapshot.recent.slice(0, 5).map((event) => (
              <li key={event.asn_id}>
                <div className="recent-date">
                  {event.event_date ?? event.event_year} · ASN {event.asn_id}
                </div>
                <div className="recent-title">{event.title ?? "Untitled occurrence"}</div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}



