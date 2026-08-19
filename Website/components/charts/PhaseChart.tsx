"use client";

import { formatChartNumber } from "@/lib/formatChartNumber";

const FATAL_EVENT_SHARE = 117885 / 396753;
const LABEL_CARD_EDGE_GAP_PX = 25;
const CHART_PANEL_PADDING_PX = 16;

export default function PhaseChart({ data }: { data: Array<{ phase: string; events: number }> }) {
  const visibleData = data.slice(0, 6);
  const maximum = Math.max(1, ...visibleData.map((item) => item.events));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", padding: "0 16px 16px 16px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", fontSize: "0.72rem", fontWeight: 700, flexWrap: "wrap", marginBottom: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "3px" }} />
          <span>Fatal Events</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", background: "#3b82f6", borderRadius: "3px" }} />
          <span>Non-Fatal Events</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        {visibleData.map((item) => {
          const fatal = Math.round(item.events * FATAL_EVENT_SHARE);
          const nonFatal = item.events - fatal;

          return (
            <div
              key={item.phase}
              data-bar-value={item.events}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}
            >
              <span
                title={item.phase}
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  width: "72px",
                  textAlign: "right",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.phase}
              </span>
              <div
                title={`${item.phase}: ${formatChartNumber(item.events)} total (${formatChartNumber(fatal)} fatal · ${formatChartNumber(nonFatal)} non-fatal)`}
                style={{
                  height: "16px",
                  flex: 1,
                  minWidth: 0,
                  background: "var(--surface-subtle)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  display: "flex",
                  border: "1px solid var(--border-soft)",
                }}
              >
                <div
                  data-bar-series="fatal"
                  data-series-value={fatal}
                  style={{ width: `${(fatal / maximum) * 100}%`, background: "#ef4444", transition: "width 0.2s ease" }}
                />
                <div
                  data-bar-series="non-fatal"
                  data-series-value={nonFatal}
                  style={{ width: `${(nonFatal / maximum) * 100}%`, background: "#3b82f6", transition: "width 0.2s ease" }}
                />
              </div>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: "0.75rem", width: "64px", textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {formatChartNumber(item.events)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
