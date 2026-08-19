"use client";

import AnnualTrendChart from "@/components/charts/AnnualTrendChart";
import type { DashboardSnapshot, PagedEvents } from "@/lib/staticData/types";


export default function HistoricalStoryteller({ events, snapshot }: { events: PagedEvents | null; snapshot?: DashboardSnapshot | null }) {
  return (
    <section>
      {snapshot ? <article className="command-panel" style={{ marginBottom: 14 }}><header className="panel-heading"><div><h2 className="panel-title">Historical event timeline</h2><p className="panel-subtitle">Long-range event volume across the active selection</p></div></header><AnnualTrendChart data={snapshot.annual} /></article> : <header className="command-panel" style={{ padding: 18, marginBottom: 14 }}><h2 className="panel-title">Historical event timeline</h2><p className="panel-subtitle">A bounded chronological selection queried directly from yearly Parquet partitions.</p></header>}
      <div className="story-grid">
        {(events?.rows ?? []).slice(0, 10).map((event) => (
          <article key={event.asn_id} className="command-panel story-card">
            <p className="recent-date">{event.event_date ?? event.event_year} · ASN {event.asn_id}</p>
            <h3 className="panel-title" style={{ marginTop: 7 }}>{event.title ?? "Untitled occurrence"}</h3>
            <p className="panel-subtitle" style={{ marginTop: 8 }}>{[event.country, event.operator, event.phase_group].filter(Boolean).join(" · ") || "Classification unavailable"}</p>
          </article>
        ))}
      </div>
      {!events?.rows.length ? <div className="status-state">No historical records match the current filters.</div> : null}
    </section>
  );
}
