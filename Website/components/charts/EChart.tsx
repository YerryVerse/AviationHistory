"use client";

import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import type { EChartsCoreOption } from "echarts/core";


echarts.use([BarChart, LineChart, GridComponent, LegendComponent, MarkPointComponent, MarkLineComponent, TooltipComponent, CanvasRenderer]);

export default function EChart({ option, ariaLabel }: { option: EChartsCoreOption; ariaLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.clientWidth === 0) return;
    const chart = echarts.init(container, undefined, { renderer: "canvas" });
    chart.setOption(option, { notMerge: true });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [option]);

  return <div ref={containerRef} className="chart-canvas" role="img" aria-label={ariaLabel} />;
}
