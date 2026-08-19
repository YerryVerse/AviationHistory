"use client";

import { useComputedColorScheme } from "@mantine/core";
import { useMemo } from "react";

import EChart from "./EChart";
import { formatChartNumber } from "@/lib/formatChartNumber";


interface AnnualPoint { year: number; events: number; fatalEvents: number }

export default function AnnualTrendChart({ data }: { data: AnnualPoint[] }) {
  const scheme = useComputedColorScheme("light");
  const option = useMemo(() => {
    const dark = scheme === "dark";
    const callouts: Array<{ year: number; label: string; width?: number }> = [
      { year: 1918, label: "Peak WWI", width: 70 },
      { year: 1944, label: "Peak WWII", width: 74 },
      { year: 1951, label: "Jet Age", width: 66 },
      { year: 1964, label: "General Aviation", width: 104 },
      { year: 1982, label: "Commercial Aviation", width: 128 },
    ];

    return {
      animationDuration: 260,
      color: [dark ? "#49b9af" : "#168b83", dark ? "#df8174" : "#ad4f42"],
      grid: { left: 46, right: 18, top: 48, bottom: 55 },
      legend: { top: 4, right: 12, textStyle: { color: dark ? "#98a8b5" : "#6d7986", fontFamily: "Roboto" } },
      tooltip: { trigger: "axis", valueFormatter: (value: unknown) => formatChartNumber(Number(value)) },
      xAxis: {
        type: "category",
        data: data.map((row) => row.year),
        boundaryGap: false,
        axisLabel: {
          color: dark ? "#98a8b5" : "#6d7986",
          interval: 0,
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
          name: "Events",
          type: "line",
          data: data.map((row) => row.events),
          showSymbol: false,
          smooth: 0.16,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.1 },
          markPoint: {
            data: callouts
              .filter((c) => data.some((d) => d.year === c.year))
              .map((c) => {
                const pt = data.find((d) => d.year === c.year);
                return {
                  name: c.label,
                  coord: [
                    data.findIndex((d) => d.year === c.year),
                    pt ? pt.events : 0,
                  ],
                  value: c.label,
                  symbol: "path://M 0,0 L 4,-5 L 32,-5 Q 35,-5 35,-8 L 35,-21 Q 35,-24 32,-24 L -32,-24 Q -35,-24 -35,-21 L -35,-8 Q -35,-5 -32,-5 L -4,-5 Z",
                  symbolSize: [c.width ?? 70, 24],
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
        { name: "Fatal events", type: "line", data: data.map((row) => row.fatalEvents), showSymbol: false, smooth: 0.16, lineStyle: { width: 2, type: "dashed" } },
      ],
    };
  }, [data, scheme]);

  return (
    <>
      <EChart option={option} ariaLabel="Annual aviation events and fatal events line chart" />
      <div className="visually-hidden sr-only" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        <table><caption>Annual event data</caption><thead><tr><th>Year</th><th>Events</th><th>Fatal events</th></tr></thead><tbody>{data.map((row) => <tr key={row.year}><td>{row.year}</td><td>{formatChartNumber(row.events)}</td><td>{formatChartNumber(row.fatalEvents)}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}
