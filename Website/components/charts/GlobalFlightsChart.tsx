"use client";

import { useComputedColorScheme } from "@mantine/core";
import { useMemo } from "react";

import EChart from "./EChart";
import { formatChartNumber } from "@/lib/formatChartNumber";

export interface GlobalFlightPoint {
  year: number;
  total_flights: number;
  coverage: string;
  status: string;
  source: string;
  source_url: string;
  notes: string;
  yoyGrowth?: number | null;
}

export default function GlobalFlightsChart({ data }: { data: GlobalFlightPoint[] }) {
  const scheme = useComputedColorScheme("light");
  const option = useMemo(() => {
    const dark = scheme === "dark";
    const callouts: Array<{ year: number; label: string; width?: number }> = [
      { year: 2008, label: "2008 Crisis", width: 88 },
      { year: 2019, label: "Pre-COVID Peak", width: 110 },
      { year: 2020, label: "COVID Drop", width: 88 },
      { year: 2024, label: "2024 Recovery", width: 102 },
    ];

    const sortedData = [...data].sort((a, b) => a.year - b.year);

    return {
      animationDuration: 260,
      color: [dark ? "#38bdf8" : "#0284c7"],
      grid: { left: 58, right: 24, top: 48, bottom: 55 },
      legend: {
        top: 4,
        right: 12,
        textStyle: { color: dark ? "#98a8b5" : "#6d7986", fontFamily: "Roboto" },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || !params.length) return "";
          const item = params[0];
          const point = sortedData[item.dataIndex];
          if (!point) return "";
          const yoyStr = point.yoyGrowth != null ? ` (${point.yoyGrowth >= 0 ? "+" : ""}${point.yoyGrowth.toFixed(1)}% YoY)` : "";
          return `
            <div style="font-family: inherit; font-size: 12px; line-height: 1.5;">
              <div style="font-weight: 700; margin-bottom: 4px; color: ${dark ? "#f1f5f9" : "#0f172a"};">
                Year ${point.year} <span style="font-weight: 400; color: #64748b; text-transform: uppercase; font-size: 10px;">[${point.status}]</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 12px;">
                <span style="color: #64748b;">Global Departures:</span>
                <span style="font-weight: 700; color: ${dark ? "#38bdf8" : "#0284c7"};">${formatChartNumber(point.total_flights)}</span>
              </div>
              ${yoyStr ? `<div style="color: ${point.yoyGrowth! >= 0 ? "#10b981" : "#ef4444"}; font-weight: 600; font-size: 11px; margin-top: 2px;">${yoyStr}</div>` : ""}
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; border-top: 1px solid ${dark ? "#334155" : "#e2e8f0"}; padding-top: 4px;">
                ${point.source}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: "category",
        data: sortedData.map((row) => row.year),
        boundaryGap: false,
        axisLabel: {
          color: dark ? "#98a8b5" : "#6d7986",
          interval: 1,
          rotate: 45,
          fontSize: 9,
        },
        axisLine: { lineStyle: { color: dark ? "#2a3b48" : "#dce3e8" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: dark ? "#98a8b5" : "#6d7986",
          formatter: (value: number) => formatChartNumber(value),
        },
        splitLine: { lineStyle: { color: dark ? "#22333f" : "#e9edf0" } },
      },
      series: [
        {
          name: "Global Departures",
          type: "line",
          data: sortedData.map((row) => row.total_flights),
          showSymbol: false,
          smooth: 0.16,
          lineStyle: { width: 2.5 },
          areaStyle: {
            opacity: 0.15,
            color: dark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.2)",
          },
          markPoint: {
            data: callouts
              .filter((c) => sortedData.some((d) => d.year === c.year))
              .map((c) => {
                const pt = sortedData.find((d) => d.year === c.year);
                return {
                  name: c.label,
                  coord: [
                    sortedData.findIndex((d) => d.year === c.year),
                    pt ? pt.total_flights : 0,
                  ],
                  value: c.label,
                  symbol: "path://M 0,0 L 4,-5 L 32,-5 Q 35,-5 35,-8 L 35,-21 Q 35,-24 32,-24 L -32,-24 Q -35,-24 -35,-21 L -35,-8 Q -35,-5 -32,-5 L -4,-5 Z",
                  symbolSize: [c.width ?? 80, 24],
                  symbolOffset: [0, -12],
                  itemStyle: {
                    color: dark ? "#f43f5e" : "#e11d48",
                    shadowBlur: 5,
                    shadowColor: "rgba(225, 29, 72, 0.35)",
                  },
                  label: {
                    formatter: c.label,
                    color: "#ffffff",
                    fontWeight: "bold",
                    fontSize: 9,
                    offset: [0, -2.5],
                  },
                };
              }),
          },
        },
      ],
    };
  }, [data, scheme]);

  return (
    <>
      <EChart option={option} ariaLabel="Annual global commercial and registered flights line chart" />
      <div className="visually-hidden sr-only" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        <table><caption>Global annual flight data</caption><thead><tr><th>Year</th><th>Departures</th></tr></thead><tbody>{data.map((row) => <tr key={row.year}><td>{row.year}</td><td>{formatChartNumber(row.total_flights)}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}
