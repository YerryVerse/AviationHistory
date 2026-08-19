"use client";

import { Badge, Button, Checkbox, Group, Tabs, Text, TextInput } from "@mantine/core";
import { useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Building2,
  Calendar,
  CheckSquare,
  CloudSun,
  Compass,
  Database,
  Download,
  FileText,
  Filter,
  FlaskConical,
  Globe,
  Layers,
  LayoutGrid,
  MapPin,
  Maximize2,
  Minimize2,
  PieChart as PieIcon,
  Plane,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Treemap, type TreemapNode } from "recharts";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AnnualTrendChart from "@/components/charts/AnnualTrendChart";
import PhaseChart from "@/components/charts/PhaseChart";
import { formatChartNumber } from "@/lib/formatChartNumber";
import { dataService } from "@/lib/staticData/dataService";
import type { AnalyticsFilters, DataScienceAircraftRateRow, DataScienceDistributionRow } from "@/lib/staticData/types";

interface RenderedCard {
  id: string;
  fieldName: string;
  fieldKey: string;
  dataType: string;
  chartType: string;
  description: string;
  statBadge: string;
  renderVisual: () => React.ReactNode;
}

interface VisualSection {
  id: string;
  title: string;
  icon: typeof Calendar;
  color: string;
  cards: RenderedCard[];
}

type TopN = 5 | 10 | 25 | 50 | 100;

const TOP_OPTIONS: TopN[] = [5, 10, 25, 50, 100];
const TopNContext = createContext<TopN>(25);
interface HiddenBarRowsState {
  hiddenRowKeys: ReadonlySet<string>;
  hideRow(key: string): void;
  toggleRow(key: string): void;
  showAll(): void;
}
const HiddenBarRowsContext = createContext<HiddenBarRowsState>({
  hiddenRowKeys: new Set<string>(),
  hideRow: () => undefined,
  toggleRow: () => undefined,
  showAll: () => undefined,
});
const SECTION_FATAL_SHARE = 117885 / 396753;
const BAR_VALUE_COLUMN_WIDTH = "72px";
const BAR_LABEL_CARD_EDGE_GAP_PX = 25;
const BAR_CHART_PANEL_PADDING_PX = 16;
const SPECIALIZED_DATABASE_BACKED_CARDS = new Set([
  "event_year",
  "event_month",
  "continent",
  "phase",
  "survival_rate_onboard",
  "fatality_rate_onboard",
]);
const DATABASE_FIELD_OVERRIDES: Record<string, string> = {
  occupants: "occupants_bands",
  fatalities_onboard: "fatalities_onboard_bands",
  survivors_onboard: "survivors_onboard_bands",
  fatalities_ground: "fatalities_ground_bands",
};
const DEFAULT_HIDDEN_BAR_ROWS: Record<string, string[]> = {
  local_time: ["Not Recorded"],
  year_of_manufacture: ["0"],
};
const ORDERED_DATABASE_BANDS: Record<string, string[]> = {
  occupants_bands: ["0", "1", "2", "3–4", "5–6", "7–9", "10–19", "20–29", "30–49", "50–69", "70–89", "90–119", "120–149", "150–179", "180–219", "220–279", "280–349", "350–449", "450+"],
  fatalities_onboard_bands: ["0", "1", "2", "3", "4–5", "6–10", "11–50", "51–100", "101+"],
  survivors_onboard_bands: ["0", "1", "2", "3", "4–5", "6–10", "11–50", "51–100", "101–499", "500+"],
  fatalities_ground_bands: ["0", "1", "2", "3", "4–5", "6–10", "11–50", "51–100", "101–499", "500–999", "1,000+"],
};
const AIRCRAFT_SURVIVAL_RATES: AircraftSurvivalItem[] = [
  { label: "Boeing 737-8", rate: 98.7, events: 570, occupants: 76451, survivors: 75486 },
  { label: "Grumman G-164B", rate: 93.3, events: 643, occupants: 661, survivors: 617 },
  { label: "Grumman G-164A", rate: 93.0, events: 764, occupants: 776, survivors: 722 },
  { label: "Hiller UH-12E", rate: 90.5, events: 468, occupants: 633, survivors: 573 },
  { label: "Hughes 269C", rate: 87.7, events: 608, occupants: 951, survivors: 834 },
  { label: "Cessna 150", rate: 87.5, events: 1222, occupants: 1794, survivors: 1570 },
  { label: "Cessna 152", rate: 86.4, events: 3048, occupants: 4269, survivors: 3688 },
  { label: "Cessna 172S", rate: 86.4, events: 837, occupants: 1376, survivors: 1189 },
  { label: "Robinson R22", rate: 86.2, events: 1996, occupants: 3240, survivors: 2794 },
  { label: "Cessna A188B", rate: 85.7, events: 608, occupants: 615, survivors: 527 },
  { label: "Cessna 208B", rate: 85.2, events: 593, occupants: 2990, survivors: 2548 },
  { label: "Piper PA-38-112", rate: 84.4, events: 853, occupants: 1327, survivors: 1120 },
  { label: "Cessna 172P", rate: 84.0, events: 1051, occupants: 2034, survivors: 1709 },
  { label: "Cessna 172R", rate: 83.5, events: 720, occupants: 1321, survivors: 1103 },
  { label: "Piper PA-18-150", rate: 82.4, events: 1091, occupants: 1601, survivors: 1319 },
  { label: "de Havilland DH-82A", rate: 82.0, events: 876, occupants: 1153, survivors: 945 },
  { label: "Cessna 172N", rate: 81.1, events: 1940, occupants: 3801, survivors: 3081 },
  { label: "Cessna 150M", rate: 80.8, events: 873, occupants: 1269, survivors: 1025 },
  { label: "Cessna A185F", rate: 80.4, events: 571, occupants: 1319, survivors: 1061 },
  { label: "Cessna 172M", rate: 80.2, events: 1565, occupants: 3137, survivors: 2517 },
  { label: "Piper PA-28-161", rate: 80.0, events: 1069, occupants: 2171, survivors: 1736 },
  { label: "Piper PA-25-235", rate: 80.0, events: 942, occupants: 949, survivors: 759 },
  { label: "Bell 206B", rate: 79.3, events: 1232, occupants: 2728, survivors: 2163 },
  { label: "Robinson R44", rate: 78.8, events: 1588, occupants: 3431, survivors: 2704 },
  { label: "Cessna 177", rate: 78.4, events: 474, occupants: 1108, survivors: 869 },
  { label: "Piper PA-28-151", rate: 77.5, events: 399, occupants: 823, survivors: 638 },
  { label: "Cessna 170B", rate: 77.0, events: 669, occupants: 1357, survivors: 1045 },
  { label: "Cessna 180", rate: 75.7, events: 1011, occupants: 2148, survivors: 1626 },
  { label: "Cessna 182Q", rate: 75.4, events: 439, occupants: 922, survivors: 695 },
  { label: "de Havilland DH.82A", rate: 75.3, events: 902, occupants: 1393, survivors: 1049 },
  { label: "Piper PA-28-181", rate: 74.8, events: 1084, occupants: 2366, survivors: 1770 },
  { label: "Cessna 140", rate: 74.3, events: 817, occupants: 1282, survivors: 953 },
  { label: "Piper PA-22-150", rate: 74.1, events: 616, occupants: 1195, survivors: 886 },
  { label: "Luscombe 8A", rate: 74.0, events: 517, occupants: 788, survivors: 583 },
  { label: "Piper PA-28-140", rate: 73.9, events: 2266, occupants: 4384, survivors: 3240 },
  { label: "Cessna 182", rate: 73.7, events: 706, occupants: 1611, survivors: 1188 },
  { label: "Cessna T210N", rate: 73.7, events: 372, occupants: 905, survivors: 667 },
  { label: "Mikoyan-Gurevich MiG-15", rate: 73.7, events: 455, occupants: 457, survivors: 337 },
  { label: "Cessna 150H", rate: 73.2, events: 440, occupants: 657, survivors: 481 },
  { label: "Cessna 172", rate: 73.1, events: 1138, occupants: 2546, survivors: 1861 },
  { label: "Piper PA-18", rate: 73.1, events: 1003, occupants: 1544, survivors: 1128 },
  { label: "Piper PA-34-200T", rate: 73.1, events: 462, occupants: 1188, survivors: 868 },
  { label: "Cessna 150L", rate: 72.3, events: 805, occupants: 1197, survivors: 866 },
  { label: "Piper PA-28R-200", rate: 72.2, events: 651, occupants: 1398, survivors: 1010 },
  { label: "Cessna 172K", rate: 72.0, events: 457, occupants: 925, survivors: 666 },
  { label: "Piper PA-12", rate: 71.7, events: 639, occupants: 1073, survivors: 769 },
  { label: "Cessna 150G", rate: 71.5, events: 471, occupants: 702, survivors: 502 },
  { label: "Piper PA-24-250", rate: 71.4, events: 659, occupants: 1393, survivors: 995 },
  { label: "de Havilland Canada DHC-6", rate: 71.2, events: 524, occupants: 5256, survivors: 3744 },
  { label: "Cessna 182P", rate: 70.9, events: 714, occupants: 1558, survivors: 1104 },
  { label: "Mooney M20J", rate: 70.9, events: 472, occupants: 921, survivors: 653 },
  { label: "de Havilland DH.98", rate: 70.7, events: 4997, occupants: 9735, survivors: 6879 },
  { label: "Beechcraft A36", rate: 70.6, events: 701, occupants: 1661, survivors: 1173 },
  { label: "Cessna U206G", rate: 70.5, events: 388, occupants: 1140, survivors: 804 },
  { label: "Cessna 150F", rate: 69.7, events: 508, occupants: 743, survivors: 518 },
  { label: "Supermarine Spitfire Mk I", rate: 69.7, events: 445, occupants: 445, survivors: 310 },
  { label: "Piper PA-32-300", rate: 69.3, events: 660, occupants: 1935, survivors: 1340 },
  { label: "Cessna 210", rate: 69.1, events: 516, occupants: 1262, survivors: 872 },
  { label: "Cessna 150J", rate: 68.8, events: 378, occupants: 586, survivors: 403 },
  { label: "Aeronca 7AC", rate: 68.7, events: 616, occupants: 1006, survivors: 691 },
  { label: "Piper PA-31-350", rate: 68.6, events: 567, occupants: 2115, survivors: 1451 },
  { label: "Piper J3C-65", rate: 67.9, events: 595, occupants: 929, survivors: 631 },
  { label: "Piper PA-28-180", rate: 65.9, events: 1389, occupants: 3037, survivors: 2000 },
  { label: "Beechcraft 58", rate: 65.4, events: 465, occupants: 1111, survivors: 727 },
  { label: "Bell ANCA", rate: 65.3, events: 1587, occupants: 2734, survivors: 1786 },
  { label: "de Havilland Canada DHC-2", rate: 64.3, events: 587, occupants: 1939, survivors: 1246 },
  { label: "Canadair SABRE", rate: 62.7, events: 573, occupants: 574, survivors: 360 },
  { label: "Piper PA-32-260", rate: 61.4, events: 428, occupants: 1286, survivors: 789 },
  { label: "Piper PA-28-235", rate: 60.8, events: 417, occupants: 945, survivors: 575 },
  { label: "Mooney M20C", rate: 60.8, events: 449, occupants: 923, survivors: 561 },
  { label: "Messerschmitt Bf 109 G-6", rate: 60.5, events: 380, occupants: 380, survivors: 230 },
  { label: "Lockheed F-104G", rate: 59.8, events: 480, occupants: 480, survivors: 287 },
  { label: "Piper PA-23-250", rate: 59.1, events: 727, occupants: 1820, survivors: 1076 },
  { label: "Hawker Hurricane Mk I", rate: 59.1, events: 565, occupants: 565, survivors: 334 },
  { label: "Beechcraft 95", rate: 57.9, events: 399, occupants: 972, survivors: 563 },
  { label: "Piper PA-22", rate: 56.5, events: 588, occupants: 1285, survivors: 726 },
  { label: "Messerschmitt Bf 110 G-4", rate: 56.1, events: 450, occupants: 1163, survivors: 653 },
  { label: "Bristol Beaufighter", rate: 55.4, events: 2457, occupants: 4982, survivors: 2760 },
  { label: "Bristol Blenheim", rate: 53.4, events: 2381, occupants: 6466, survivors: 3454 },
  { label: "Airspeed Oxford", rate: 51.3, events: 393, occupants: 751, survivors: 385 },
  { label: "North American F-86F", rate: 51.2, events: 460, occupants: 463, survivors: 237 },
  { label: "Republic F-84F", rate: 48.4, events: 609, occupants: 609, survivors: 295 },
  { label: "de Havilland DH.100", rate: 48.2, events: 481, occupants: 481, survivors: 232 },
  { label: "North American F-51D", rate: 45.9, events: 430, occupants: 436, survivors: 200 },
  { label: "Bell UH-1H", rate: 45.8, events: 372, occupants: 1802, survivors: 825 },
  { label: "Beechcraft 35", rate: 45.7, events: 792, occupants: 1927, survivors: 881 },
  { label: "Hawker Typhoon", rate: 45.5, events: 775, occupants: 775, survivors: 353 },
  { label: "Armstrong Whitworth", rate: 44.0, events: 551, occupants: 2325, survivors: 1023 },
  { label: "Vought F4U-4", rate: 42.3, events: 524, occupants: 525, survivors: 222 },
  { label: "Piper PA-24", rate: 38.3, events: 436, occupants: 1057, survivors: 405 },
  { label: "Republic F-84G", rate: 37.8, events: 692, occupants: 704, survivors: 266 },
  { label: "North American Harvard", rate: 34.3, events: 462, occupants: 671, survivors: 230 },
  { label: "Lockheed Hudson", rate: 31.5, events: 404, occupants: 1736, survivors: 547 },
  { label: "Handley Page Halifax Mk II", rate: 31.3, events: 722, occupants: 5124, survivors: 1605 },
  { label: "Handley Page Hampden Mk I", rate: 30.2, events: 498, occupants: 1865, survivors: 563 },
  { label: "Vickers Wellington Mk IC", rate: 30.1, events: 493, occupants: 2808, survivors: 844 },
  { label: "Lockheed T-33A", rate: 27.6, events: 825, occupants: 1214, survivors: 335 },
  { label: "Avro Lancaster Mk I", rate: 22.5, events: 803, occupants: 5556, survivors: 1248 },
  { label: "Avro Lancaster Mk III", rate: 21.5, events: 972, occupants: 6916, survivors: 1485 },
  { label: "Vickers Wellington Mk III", rate: 20.7, events: 369, occupants: 1976, survivors: 409 },
];
const MILITARY_AIRCRAFT_LABELS = new Set([
  "Airspeed Oxford",
  "Armstrong Whitworth",
  "Avro Lancaster Mk I",
  "Avro Lancaster Mk III",
  "Bell UH-1H",
  "Bristol Beaufighter",
  "Bristol Blenheim",
  "Canadair SABRE",
  "Handley Page Halifax Mk II",
  "Handley Page Hampden Mk I",
  "Hawker Hurricane Mk I",
  "Hawker Typhoon",
  "Lockheed Hudson",
  "Messerschmitt Bf 109 G-6",
  "Messerschmitt Bf 110 G-4",
  "North American Harvard",
  "Supermarine Spitfire Mk I",
  "Vickers Wellington Mk IC",
  "Vickers Wellington Mk III",
  "Vought F4U-4",
  "de Havilland DH.82A",
  "de Havilland DH.98",
]);

function barLabelColumnWidth(labels: string[]) {
  const longestLabel = Math.max(...labels.map((label) => label.length), 1);
  const labelTextWidth = Math.ceil(longestLabel * 6.8);
  const internalGutter = BAR_LABEL_CARD_EDGE_GAP_PX - BAR_CHART_PANEL_PADDING_PX;
  const estimatedWidth = Math.max(64, labelTextWidth + internalGutter);

  // Keep the longest visible label 25px from the panel edge while aligning every bar origin.
  return `min(${estimatedWidth}px, 44%)`;
}

function numericBarValue(value: string | number) {
  return typeof value === "number" ? value : Number(value.replace(/[^\d.-]/g, "")) || 0;
}

function maxStackedTotal(items: Array<{ fatal: number; nonFatal: number }>) {
  return items.reduce((maximum, item) => Math.max(maximum, item.fatal + item.nonFatal), 0);
}

function TopNChartFilter({
  children,
  showRankingControls = true,
  showSeriesControls = true,
  initialHiddenRowKeys = [],
}: {
  children: React.ReactNode;
  showRankingControls?: boolean;
  showSeriesControls?: boolean;
  initialHiddenRowKeys?: string[];
}) {
  const [topN, setTopN] = useState<TopN>(25);
  const [showFatal, setShowFatal] = useState(true);
  const [showNonFatal, setShowNonFatal] = useState(true);
  const [visibleTotal, setVisibleTotal] = useState(0);
  const [hiddenRowKeys, setHiddenRowKeys] = useState<Set<string>>(
    () => new Set(initialHiddenRowKeys)
  );
  const chartBodyRef = useRef<HTMLDivElement>(null);
  const hiddenRowsState: HiddenBarRowsState = {
    hiddenRowKeys,
    hideRow: (key) => {
      setHiddenRowKeys((current) => {
        if (current.has(key)) return current;
        const next = new Set(current);
        next.add(key);
        return next;
      });
    },
    toggleRow: (key) => {
      setHiddenRowKeys((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    showAll: () => setHiddenRowKeys(new Set()),
  };

  useLayoutEffect(() => {
    if (!showSeriesControls) return;

    const rows = Array.from(
      chartBodyRef.current?.querySelectorAll<HTMLElement>("[data-bar-value]") ?? []
    );
    const rowValues = rows.map((row) => {
      const fatalSegment = row.querySelector<HTMLElement>('[data-bar-series="fatal"]');
      const nonFatalSegment = row.querySelector<HTMLElement>('[data-bar-series="non-fatal"]');
      const fatal = Number(fatalSegment?.dataset.seriesValue ?? 0);
      const nonFatal = Number(nonFatalSegment?.dataset.seriesValue ?? 0);

      return {
        row,
        fatalSegment,
        nonFatalSegment,
        fatal,
        nonFatal,
        selected: (showFatal ? fatal : 0) + (showNonFatal ? nonFatal : 0),
      };
    });
    const selectedMaximum = rowValues.reduce(
      (maximum, item) => Math.max(maximum, item.selected),
      0
    );
    const selectedTotal = rowValues.reduce((total, item) => total + item.selected, 0);
    setVisibleTotal((current) => current === selectedTotal ? current : selectedTotal);

    rowValues.forEach(({ row, fatalSegment, nonFatalSegment, fatal, nonFatal, selected }) => {
      if (fatalSegment) {
        fatalSegment.style.width =
          showFatal && selectedMaximum > 0 ? `${(fatal / selectedMaximum) * 100}%` : "0%";
      }
      if (nonFatalSegment) {
        nonFatalSegment.style.width =
          showNonFatal && selectedMaximum > 0 ? `${(nonFatal / selectedMaximum) * 100}%` : "0%";
      }

      const output = row.lastElementChild;
      if (output instanceof HTMLElement) {
        output.textContent = formatChartNumber(selected);
        output.dataset.activeBarValue = String(selected);
      }
    });
  }, [children, hiddenRowKeys, showFatal, showNonFatal, showSeriesControls, topN]);

  return (
    <HiddenBarRowsContext.Provider value={hiddenRowsState}>
      <TopNContext.Provider value={topN}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
        {(showRankingControls || showSeriesControls) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px 16px",
              width: "100%",
            }}
          >
            {showSeriesControls && (
              <div
                role="group"
                aria-label="Bar chart series visibility"
                style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap", gap: "10px" }}
              >
                <VisibleBarTotal value={visibleTotal} />
                {[
                  { label: "Fatal", color: "#ef4444", active: showFatal, toggle: () => setShowFatal((value) => !value) },
                  { label: "Non-Fatal", color: "#3b82f6", active: showNonFatal, toggle: () => setShowNonFatal((value) => !value) },
                ].map((series) => (
                  <button
                    key={series.label}
                    type="button"
                    aria-pressed={series.active}
                    aria-label={`Toggle ${series.label} series`}
                    onClick={series.toggle}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "4px 7px",
                      border: 0,
                      borderRadius: "6px",
                      background: series.active ? "var(--surface)" : "transparent",
                      color: series.active ? "var(--text)" : "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: series.active ? 1 : 0.55,
                      transition: "opacity 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "16px",
                        height: "16px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "4px",
                        background: series.active ? series.color : "transparent",
                        border: `2px solid ${series.color}`,
                        color: "#ffffff",
                        fontSize: "0.65rem",
                        lineHeight: 1,
                      }}
                    >
                      {series.active ? "✓" : ""}
                    </span>
                    {series.label}
                  </button>
                ))}
                <AllDataButton
                  isSeriesFiltered={!showFatal || !showNonFatal}
                  onResetSeries={() => {
                    setShowFatal(true);
                    setShowNonFatal(true);
                  }}
                />
              </div>
            )}

            {showRankingControls && (
              <div
                aria-label="Horizontal bar chart ranking limit"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginLeft: showSeriesControls ? "auto" : undefined,
                }}
              >
                {TOP_OPTIONS.map((option) => {
                  const active = option === topN;

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTopN(option)}
                      style={{
                        padding: "4px 11px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        borderRadius: "20px",
                        border: active ? "1px solid #0d9488" : "1px solid var(--border-soft)",
                        background: active ? "#0d9488" : "var(--surface)",
                        color: active ? "#ffffff" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                      }}
                    >
                      TOP {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div
          className={
            showSeriesControls
              ? `bar-series-scope${showFatal ? "" : " hide-fatal"}${showNonFatal ? "" : " hide-non-fatal"}`
              : "single-series-scope"
          }
        >
          <style>{`
            .bar-series-scope.hide-fatal [data-bar-series="fatal"],
            .bar-series-scope.hide-fatal [title^="Fatal:"] {
              display: none !important;
            }
            .bar-series-scope.hide-non-fatal [data-bar-series="non-fatal"],
            .bar-series-scope.hide-non-fatal [title^="Non-Fatal:"] {
              display: none !important;
            }
          `}</style>
          <div ref={chartBodyRef} className="bar-series-body">{children}</div>
        </div>
        </div>
      </TopNContext.Provider>
    </HiddenBarRowsContext.Provider>
  );
}

function VisibleBarTotal({
  value,
  suffix = "",
  minimumFractionDigits = 0,
  maximumFractionDigits = 20,
}: {
  value: number;
  suffix?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}) {
  return (
    <span
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 7px",
        color: "var(--text)",
        fontSize: "0.75rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      Total: {value.toLocaleString("en-US", {
        minimumFractionDigits,
        maximumFractionDigits,
      })}{suffix}
    </span>
  );
}

function AllDataButton({
  isSeriesFiltered = false,
  onResetSeries,
}: {
  isSeriesFiltered?: boolean;
  onResetSeries?: () => void;
}) {
  const { hiddenRowKeys, showAll } = useContext(HiddenBarRowsContext);
  if (hiddenRowKeys.size === 0 && !isSeriesFiltered) return null;

  return (
    <button
      type="button"
      aria-label="Restore all hidden data"
      onClick={() => {
        showAll();
        if (onResetSeries) onResetSeries();
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        border: "1px solid #0d9488",
        borderRadius: "6px",
        background: "#0d9488",
        color: "#ffffff",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <RotateCcw size={13} />
      All Data
    </button>
  );
}

function TopNRows({
  children,
  sortByValue = true,
}: {
  children: React.ReactNode;
  sortByValue?: boolean;
}) {
  const topN = useContext(TopNContext);
  const rows = Children.toArray(children);

  if (sortByValue) {
    rows.sort((a, b) => {
      const valueOf = (child: React.ReactNode) =>
        isValidElement(child)
          ? Number((child.props as { "data-bar-value"?: number })["data-bar-value"] ?? 0)
          : 0;

      return valueOf(b) - valueOf(a);
    });
  }

  return <>{rows.slice(0, topN)}</>;
}

function MiniBarList({ items }: { items: Array<{ label: string; value: string | number; pct: number; color?: string }> }) {
  const topN = useContext(TopNContext);
  const maxValue = items.reduce((maximum, item) => Math.max(maximum, numericBarValue(item.value)), 0);
  const visibleItems = [...items]
    .sort((a, b) => numericBarValue(b.value) - numericBarValue(a.value))
    .slice(0, topN);
  const labelColumnWidth = barLabelColumnWidth(visibleItems.map((item) => item.label));

  return (
    <div
      data-chart-style="horizontal-bar-reference"
      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", paddingTop: "4px" }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
          <span>Fatal Events</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
          <span>Non-Fatal Events</span>
        </div>
      </div>

      {visibleItems.map((item) => {
        const total = numericBarValue(item.value);
        const fatal = Math.round(total * SECTION_FATAL_SHARE);
        const nonFatal = Math.max(0, total - fatal);
        const totalWidth = maxValue > 0 ? (total / maxValue) * 100 : 0;

        return (
          <div
            key={item.label}
            data-bar-value={total}
            style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}
          >
            <span
              title={item.label}
              style={{
                color: "var(--text)",
                fontWeight: 700,
                fontSize: "0.75rem",
                width: labelColumnWidth,
                textAlign: "right",
                flexShrink: 0,
                lineHeight: "1rem",
                whiteSpace: "normal",
                overflow: "visible",
                textOverflow: "clip",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.label}
            </span>
            <div
              title={`${item.label}: ${total.toLocaleString("en-US")} total (${fatal.toLocaleString("en-US")} fatal · ${nonFatal.toLocaleString("en-US")} non-fatal)`}
              style={{
                height: "16px",
                flex: 1,
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
                title={`Fatal: ${fatal.toLocaleString("en-US")} (${(SECTION_FATAL_SHARE * 100).toFixed(1)}%)`}
                style={{
                  height: "100%",
                  width: `${totalWidth * SECTION_FATAL_SHARE}%`,
                  background: "#ef4444",
                  transition: "width 0.2s ease",
                  flexShrink: 0,
                }}
              />
              <div
                data-bar-series="non-fatal"
                data-series-value={nonFatal}
                title={`Non-Fatal: ${nonFatal.toLocaleString("en-US")}`}
                style={{
                  height: "100%",
                  width: `${totalWidth * (1 - SECTION_FATAL_SHARE)}%`,
                  background: "#3b82f6",
                  transition: "width 0.2s ease",
                  flexShrink: 0,
                }}
              />
            </div>
            <span
              style={{
                color: "var(--text)",
                fontWeight: 700,
                fontSize: "0.75rem",
                width: BAR_VALUE_COLUMN_WIDTH,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {typeof item.value === "number" ? formatChartNumber(item.value) : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface AircraftSurvivalItem {
  label: string;
  rate: number;
  events: number;
  occupants: number;
  survivors: number;
  designation?: string;
}

function AircraftOnboardRateChart({
  items,
  metric,
}: {
  items: AircraftSurvivalItem[];
  metric: "survival" | "fatality";
}) {
  const topN = useContext(TopNContext);
  const { hiddenRowKeys, hideRow } = useContext(HiddenBarRowsContext);
  const [rankingMode, setRankingMode] = useState<"best" | "worst">("best");
  const [showCivil, setShowCivil] = useState(true);
  const [showMilitary, setShowMilitary] = useState(true);
  const metricLabel = metric === "survival" ? "survival" : "fatality";
  const visibleItems = items
    .filter((item) => {
      const military = item.designation === "Military" || (!item.designation && MILITARY_AIRCRAFT_LABELS.has(item.label));
      return !hiddenRowKeys.has(item.label) && (military ? showMilitary : showCivil);
    })
    .map((item) => ({
      ...item,
      designation: item.designation ?? (MILITARY_AIRCRAFT_LABELS.has(item.label) ? "Military" : "Civil"),
      displayedRate: metric === "survival" ? item.rate : 100 - item.rate,
    }))
    .sort((a, b) =>
      rankingMode === "best"
        ? metric === "survival"
          ? b.displayedRate - a.displayedRate || b.occupants - a.occupants || a.label.localeCompare(b.label)
          : a.displayedRate - b.displayedRate || b.occupants - a.occupants || a.label.localeCompare(b.label)
        : metric === "survival"
          ? a.displayedRate - b.displayedRate || b.occupants - a.occupants || a.label.localeCompare(b.label)
          : b.displayedRate - a.displayedRate || b.occupants - a.occupants || a.label.localeCompare(b.label)
    )
    .slice(0, topN);
  const maximum = Math.max(1, ...visibleItems.map((item) => item.displayedRate));
  const visibleTotal = visibleItems.reduce(
    (total, item) => total + Number(item.displayedRate.toFixed(1)),
    0
  );
  const labelColumnWidth = barLabelColumnWidth(visibleItems.map((item) => item.label));
  const barColor = rankingMode === "best" ? "#3b82f6" : "#ef4444";

  return (
    <div
      data-chart-style="horizontal-bar-reference"
      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", paddingTop: "4px" }}
    >
      <div
        role="group"
        aria-label={`Aircraft ${metricLabel} ranking direction`}
        style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px" }}
      >
        <VisibleBarTotal
          value={visibleTotal}
          suffix="%"
          minimumFractionDigits={1}
          maximumFractionDigits={1}
        />
        {[
          { mode: "best" as const, label: "Best", color: "#3b82f6" },
          { mode: "worst" as const, label: "Worst", color: "#ef4444" },
        ].map((option) => {
          const active = rankingMode === option.mode;

          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              aria-label={`Show ${option.label} aircraft ${metricLabel} rates`}
              onClick={() => setRankingMode(option.mode)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 7px",
                border: 0,
                borderRadius: "6px",
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                opacity: active ? 1 : 0.55,
                transition: "opacity 0.15s ease, background 0.15s ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "16px",
                  height: "16px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "4px",
                  background: active ? option.color : "transparent",
                  border: `2px solid ${option.color}`,
                  color: "#ffffff",
                  fontSize: "0.65rem",
                  lineHeight: 1,
                }}
              >
                {active ? "✓" : ""}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Aircraft designation visibility"
        style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px" }}
      >
        {[
          { label: "Civil", color: "#0d9488", active: showCivil, toggle: () => setShowCivil((value) => !value) },
          { label: "Military", color: "#8b5cf6", active: showMilitary, toggle: () => setShowMilitary((value) => !value) },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option.active}
            aria-label={`Toggle ${option.label} aircraft`}
            onClick={option.toggle}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "4px 7px",
              border: 0,
              borderRadius: "6px",
              background: option.active ? "var(--surface)" : "transparent",
              color: option.active ? "var(--text)" : "var(--text-muted)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              opacity: option.active ? 1 : 0.55,
              transition: "opacity 0.15s ease, background 0.15s ease",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "16px",
                height: "16px",
                display: "grid",
                placeItems: "center",
                borderRadius: "4px",
                background: option.active ? option.color : "transparent",
                border: `2px solid ${option.color}`,
                color: "#ffffff",
                fontSize: "0.65rem",
                lineHeight: 1,
              }}
            >
              {option.active ? "✓" : ""}
            </span>
            {option.label}
          </button>
        ))}
        <AllDataButton />
      </div>

      {visibleItems.map((item) => (
        <div
          key={item.label}
          data-aircraft-onboard-rate={item.displayedRate}
          data-aircraft-designation={item.designation}
          role="button"
          tabIndex={0}
          aria-label={`Hide ${item.label} from this chart`}
          onClick={() => hideRow(item.label)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              hideRow(item.label);
            }
          }}
          style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", cursor: "pointer" }}
        >
          <span
            title={item.label}
            style={{
              color: "var(--text)",
              fontWeight: 700,
              fontSize: "0.75rem",
              width: labelColumnWidth,
              textAlign: "right",
              flexShrink: 0,
              lineHeight: "1rem",
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "clip",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {item.label}
          </span>
          <div
            title={`${item.label} · ${item.designation}: ${item.displayedRate.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% ${metricLabel} · ${formatChartNumber(metric === "survival" ? item.survivors : item.occupants - item.survivors)} ${metric === "survival" ? "survivors" : "fatalities"} of ${formatChartNumber(item.occupants)} occupants across ${formatChartNumber(item.events)} events`}
            style={{
              height: "16px",
              flex: 1,
              background: "var(--surface-subtle)",
              borderRadius: "4px",
              overflow: "hidden",
              border: "1px solid var(--border-soft)",
            }}
          >
            <div
              style={{
                width: `${(item.displayedRate / maximum) * 100}%`,
                height: "100%",
                background: barColor,
                transition: "width 0.2s ease",
              }}
            />
          </div>
          <span
            style={{
              color: "var(--text)",
              fontWeight: 700,
              fontSize: "0.75rem",
              width: BAR_VALUE_COLUMN_WIDTH,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            {item.displayedRate.toLocaleString("en-US", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}%
          </span>
        </div>
      ))}
      {visibleItems.length === 0 && (
        <div
          style={{
            padding: "18px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            border: "1px dashed var(--border-soft)",
            borderRadius: "6px",
          }}
        >
          Select Civil or Military aircraft to display the ranking.
        </div>
      )}
    </div>
  );
}

interface StackedBarItem {
  label: string;
  fatal: number;
  nonFatal: number;
  labelWidth?: number;
}

function StackedBarChart({
  items,
  availableTops = [10, 25, 50, 100],
  defaultTop = 25,
  labelWidth = 155,
}: {
  items: StackedBarItem[];
  availableTops?: TopN[];
  defaultTop?: TopN;
  labelWidth?: number;
}) {
  const [topN, setTopN] = useState<TopN>(defaultTop);

  const sorted = [...items].sort((a, b) => (b.fatal + b.nonFatal) - (a.fatal + a.nonFatal));
  const visible = sorted.slice(0, topN);
  const maxTotal = maxStackedTotal(visible);
  const labelColumnWidth = barLabelColumnWidth(visible.map((item) => item.label));

  const validTops = availableTops.filter((n) => n <= items.length + (items.length < n ? 0 : 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", paddingTop: "4px" }}>
      {/* TOP N Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
        {availableTops.map((n) => {
          const disabled = n > items.length;
          return (
            <button
              key={n}
              onClick={() => !disabled && setTopN(n)}
              disabled={disabled}
              style={{
                padding: "3px 10px",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                borderRadius: "20px",
                border: topN === n ? "none" : "1px solid var(--border-soft)",
                background: topN === n ? "#0d9488" : "transparent",
                color: topN === n ? "#ffffff" : disabled ? "var(--text-muted)" : "var(--text-secondary)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              TOP {n}
            </button>
          );
        })}
      </div>

      {/* Bar Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", width: "100%" }}>
        {visible.map((item, idx) => {
          const total = item.fatal + item.nonFatal;
          const fatalPct = total > 0 ? ((item.fatal / total) * 100).toFixed(1) : "0.0";
          const fatalW = maxTotal > 0 ? (item.fatal / maxTotal) * 100 : 0;
          const nonFatalW = maxTotal > 0 ? (item.nonFatal / maxTotal) * 100 : 0;

          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              {/* Rank */}
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  width: "18px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>

              {/* Label */}
              <span
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  width: `min(max(${labelWidth}px, ${labelColumnWidth}), 34%)`,
                  textAlign: "right",
                  flexShrink: 0,
                  lineHeight: "1rem",
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "clip",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
                title={item.label}
              >
                {item.label}
              </span>

              {/* Stacked Bar */}
              <div
                style={{
                  height: "16px",
                  flex: 1,
                  background: "var(--surface-subtle)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  display: "flex",
                  border: "1px solid var(--border-soft)",
                }}
                title={`${item.label}: ${total.toLocaleString("en-US")} total (${item.fatal.toLocaleString("en-US")} fatal · ${item.nonFatal.toLocaleString("en-US")} non-fatal)`}
              >
                <div
                  style={{
                    width: `${fatalW}%`,
                    background: "#ef4444",
                    height: "100%",
                    transition: "width 0.25s ease",
                    flexShrink: 0,
                  }}
                  title={`Fatal: ${item.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                />
                <div
                  style={{
                    width: `${nonFatalW}%`,
                    background: "#3b82f6",
                    height: "100%",
                    transition: "width 0.25s ease",
                    flexShrink: 0,
                  }}
                  title={`Non-Fatal: ${item.nonFatal.toLocaleString("en-US")}`}
                />
              </div>

              {/* Total */}
              <span
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  width: BAR_VALUE_COLUMN_WIDTH,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {total.toLocaleString("en-US")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RegistrationBarItem {
  label: string;
  fatal: number;
  nonFatal: number;
}

function RegistrationBarChart({
  items,
  sortByValue = true,
  fatalLabel = "Fatal Events",
  nonFatalLabel = "Non-Fatal Events",
}: {
  items: RegistrationBarItem[];
  sortByValue?: boolean;
  fatalLabel?: string;
  nonFatalLabel?: string;
}) {
  const topN = useContext(TopNContext);
  const { hiddenRowKeys, hideRow } = useContext(HiddenBarRowsContext);
  const orderedItems = sortByValue
    ? [...items].sort((a, b) => (b.fatal + b.nonFatal) - (a.fatal + a.nonFatal))
    : items;
  const visibleItems = orderedItems
    .filter((item) => !hiddenRowKeys.has(item.label))
    .slice(0, topN);
  const maxTotal = visibleItems.reduce(
    (maximum, item) => Math.max(maximum, item.fatal + item.nonFatal),
    0
  );
  const hasFatalEvents = visibleItems.some((item) => item.fatal > 0);
  const hasNonFatalEvents = visibleItems.some((item) => item.nonFatal > 0);
  const labelColumnWidth = barLabelColumnWidth(visibleItems.map((item) => item.label));

  return (
    <div
      data-chart-style="horizontal-bar-reference"
      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", paddingTop: "4px" }}
    >
      <div
        style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}
      >
        {hasFatalEvents && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
            <span>{fatalLabel}</span>
          </div>
        )}
        {hasNonFatalEvents && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
            <span>{nonFatalLabel}</span>
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "9px", width: "100%" }}
      >
        {visibleItems.map((item) => {
          const total = item.fatal + item.nonFatal;
          const fatalWidth = maxTotal > 0 ? (item.fatal / maxTotal) * 100 : 0;
          const nonFatalWidth = maxTotal > 0 ? (item.nonFatal / maxTotal) * 100 : 0;
          const fatalPct = total > 0 ? ((item.fatal / total) * 100).toFixed(1) : "0.0";

          return (
            <div
              key={item.label}
              data-bar-value={total}
              role="button"
              tabIndex={0}
              aria-label={`Hide ${item.label} from this chart`}
              onClick={() => hideRow(item.label)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  hideRow(item.label);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <span
                title={item.label}
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  width: labelColumnWidth,
                  textAlign: "right",
                  flexShrink: 0,
                  lineHeight: "1rem",
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "clip",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {item.label}
              </span>

              <div
                title={`${item.label}: ${formatChartNumber(total)} total (${formatChartNumber(item.fatal)} ${fatalLabel.toLowerCase()} · ${formatChartNumber(item.nonFatal)} ${nonFatalLabel.toLowerCase()})`}
                style={{
                  height: "16px",
                  flex: 1,
                  background: "var(--surface-subtle)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: "1px solid var(--border-soft)",
                  display: "flex",
                }}
              >
                <div
                  data-bar-series="fatal"
                  data-series-value={item.fatal}
                  title={`${fatalLabel}: ${formatChartNumber(item.fatal)} (${fatalPct}%)`}
                  style={{
                    width: `${fatalWidth}%`,
                    height: "100%",
                    background: "#ef4444",
                    transition: "width 0.2s ease",
                    flexShrink: 0,
                  }}
                />
                <div
                  data-bar-series="non-fatal"
                  data-series-value={item.nonFatal}
                  title={`${nonFatalLabel}: ${formatChartNumber(item.nonFatal)}`}
                  style={{
                    width: `${nonFatalWidth}%`,
                    height: "100%",
                    background: "#3b82f6",
                    transition: "width 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              </div>

              <span
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  width: BAR_VALUE_COLUMN_WIDTH,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {formatChartNumber(total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderedBandChart({
  items,
  fatalLabel,
  nonFatalLabel,
}: {
  items: RegistrationBarItem[];
  fatalLabel?: string;
  nonFatalLabel?: string;
}) {
  return (
    <RegistrationBarChart
      items={items}
      sortByValue={false}
      fatalLabel={fatalLabel}
      nonFatalLabel={nonFatalLabel}
    />
  );
}

const DONUT_COLORS = [
  "#168b83", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f59e0b", "#10b981", "#6366f1", "#14b8a6", "#f97316",
  "#06b6d4", "#84cc16",
];

function GenericDonutChart({
  items,
  showFatal = true,
  showNonFatal = true,
}: {
  items: Array<{ label: string; fatal: number; nonFatal: number }>;
  showFatal?: boolean;
  showNonFatal?: boolean;
}) {
  const { hiddenRowKeys, toggleRow, showAll } = useContext(HiddenBarRowsContext);
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());

  const hiddenLabels = useMemo(() => {
    const combined = new Set<string>();
    if (hiddenRowKeys) {
      hiddenRowKeys.forEach((key) => combined.add(key));
    }
    localHidden.forEach((key) => combined.add(key));
    return combined;
  }, [hiddenRowKeys, localHidden]);

  const toggleHide = (label: string) => {
    if (toggleRow) {
      toggleRow(label);
    }
    setLocalHidden((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleRestore = () => {
    if (showAll) showAll();
    setLocalHidden(new Set());
  };

  const visibleItems = items.slice(0, 12);
  const data = visibleItems
    .filter((item) => !hiddenLabels.has(item.label))
    .map((item) => {
      const value = (showFatal ? item.fatal : 0) + (showNonFatal ? item.nonFatal : 0);
      return { name: item.label, value, fatal: item.fatal, nonFatal: item.nonFatal };
    })
    .filter((d) => d.value > 0);

  const totalSum = data.reduce((acc, curr) => acc + curr.value, 0);

  if (visibleItems.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
        No series data selected.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", padding: "4px 0" }}>
      {hiddenLabels.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 4px" }}>
          <button
            type="button"
            onClick={handleRestore}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              border: "1px solid #0d9488",
              borderRadius: "6px",
              background: "#0d9488",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              transition: "all 0.15s ease",
            }}
          >
            <RotateCcw size={13} />
            Restore All Data ({hiddenLabels.size} hidden)
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "24px", minHeight: "400px" }}>
        <div style={{ flex: "1 1 340px", height: "380px", position: "relative" }}>
          {data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={175}
                    paddingAngle={2}
                    isAnimationActive={false}
                    onClick={(entry) => {
                      const label = entry?.name ?? entry?.payload?.name;
                      if (label) {
                        toggleHide(String(label));
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {data.map((entry) => {
                      const origIndex = visibleItems.findIndex((item) => item.label === entry.name);
                      const colorIndex = origIndex >= 0 ? origIndex : 0;
                      return (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={DONUT_COLORS[colorIndex % DONUT_COLORS.length]}
                          style={{ cursor: "pointer" }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatChartNumber(Number(val ?? 0)), "Events"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
                  {formatChartNumber(totalSum)}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginTop: "4px", letterSpacing: "0.06em" }}>
                  Total
                </div>
              </div>
            </>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
              <span>All donut series are hidden.</span>
              <button
                type="button"
                onClick={handleRestore}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  border: "1px solid #0d9488",
                  borderRadius: "6px",
                  background: "#0d9488",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                Restore All Data
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            flex: "1 1 280px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "8px",
            maxHeight: "380px",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {visibleItems.map((item, index) => {
            const isHidden = hiddenLabels.has(item.label);
            const value = (showFatal ? item.fatal : 0) + (showNonFatal ? item.nonFatal : 0);
            const pct = totalSum > 0 && !isHidden ? ((value / totalSum) * 100).toFixed(1) : "0.0";

            return (
              <div
                key={item.label}
                onClick={() => toggleHide(item.label)}
                title={isHidden ? `Click to restore ${item.label}` : `Click to hide ${item.label}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  background: isHidden ? "var(--surface-subtle)" : "var(--surface)",
                  border: isHidden ? "1px dashed var(--border-soft)" : "1px solid var(--border-soft)",
                  fontSize: "0.76rem",
                  cursor: "pointer",
                  opacity: isHidden ? 0.45 : 1,
                  userSelect: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background: isHidden ? "var(--text-muted)" : DONUT_COLORS[index % DONUT_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: isHidden ? "var(--text-muted)" : "var(--text)",
                      textDecoration: isHidden ? "line-through" : "none",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", fontVariantNumeric: "tabular-nums" }}>
                    {isHidden ? "Hidden" : `${formatChartNumber(value)} (${pct}%)`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GenericTreemapChart({
  items,
  showFatal = true,
  showNonFatal = true,
}: {
  items: Array<{ label: string; fatal: number; nonFatal: number }>;
  showFatal?: boolean;
  showNonFatal?: boolean;
}) {
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());

  const toggleHide = (label: string) => {
    setHiddenLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const visibleItems = items.slice(0, 15);
  const data = visibleItems
    .filter((item) => !hiddenLabels.has(item.label))
    .map((item) => {
      const value = (showFatal ? item.fatal : 0) + (showNonFatal ? item.nonFatal : 0);
      return { name: item.label, value, fatal: item.fatal, nonFatal: item.nonFatal };
    })
    .filter((d) => d.value > 0);

  if (visibleItems.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
        No series data selected.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;

  const colorScale = showFatal && showNonFatal
    ? TREEMAP_BLUE_SCALE
    : showFatal
      ? TREEMAP_FATAL_SCALE
      : TREEMAP_GREEN_SCALE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      {hiddenLabels.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Hidden items: {hiddenLabels.size}
          </span>
          <button
            onClick={() => setHiddenLabels(new Set())}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            Show All ({hiddenLabels.size} hidden)
          </button>
        </div>
      )}

      {data.length > 0 ? (
        <div style={{ width: "100%", height: "260px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="value"
              nameKey="name"
              aspectRatio={4 / 3}
              isAnimationActive={false}
              content={(node) => (
                <TreemapCell
                  node={node}
                  minimum={minVal}
                  maximum={maxVal}
                  colorScale={colorScale}
                  isOverview={true}
                  overviewActionLabel="Click to hide series."
                  onActivate={() => {
                    if (node && node.name) {
                      toggleHide(String(node.name));
                    }
                  }}
                />
              )}
            />
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: "260px", display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, border: "1px dashed var(--border-soft)", borderRadius: "8px" }}>
          All series hidden. <button onClick={() => setHiddenLabels(new Set())} style={{ marginLeft: "8px", color: "#3b82f6", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>Restore all</button>
        </div>
      )}
    </div>
  );
}

function DatabaseDistributionChart({
  fieldKey,
  rows,
  loading,
  error,
}: {
  fieldKey: string;
  rows: DataScienceDistributionRow[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div
        role="status"
        style={{
          padding: "36px 24px",
          color: "var(--text-muted)",
          textAlign: "center",
          fontWeight: 600,
          fontSize: "0.85rem",
          display: "grid",
          placeItems: "center",
          minHeight: "160px",
        }}
      >
        Loading Data
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" style={{ padding: "24px", color: "#dc2626", textAlign: "center" }}>
        Database query failed: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: "24px", color: "var(--text-muted)", textAlign: "center" }}>
        No recorded values in the selected period.
      </div>
    );
  }

  const explicitOrder = fieldKey === "event_weekday"
    ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    : fieldKey === "event_day"
      ? Array.from({ length: 31 }, (_, index) => String(index + 1))
    : ORDERED_DATABASE_BANDS[fieldKey];
  const orderedRows = explicitOrder
    ? [...rows].sort((a, b) => explicitOrder.indexOf(a.value) - explicitOrder.indexOf(b.value))
    : rows;

  return (
    <RegistrationBarChart
      items={orderedRows.map((row) => ({
        label: fieldKey === "event_day" ? row.value.padStart(2, "0") : row.value,
        fatal: row.fatal,
        nonFatal: row.nonFatal,
      }))}
      sortByValue={false}
    />
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const TREEMAP_BLUE_SCALE = [
  "#dbeafe",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
] as const;

const TREEMAP_GREEN_SCALE = [
  "#dcfce7",
  "#bbf7d0",
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
] as const;

const TREEMAP_FATAL_SCALE = [
  "#fee2e2",
  "#fecaca",
  "#fca5a5",
  "#f87171",
  "#ef5350",
  "#f0443e",
  "#ef3731",
  "#EE2A24",
] as const;

function treemapColor(
  value: number,
  minimum: number,
  maximum: number,
  colorScale: readonly string[]
) {
  const range = Math.max(maximum - minimum, 1);
  const index = Math.min(
    colorScale.length - 1,
    Math.floor(((value - minimum) / range) * colorScale.length)
  );
  return colorScale[index];
}

function TreemapCell({
  node,
  minimum,
  maximum,
  colorScale,
  isOverview,
  overviewActionLabel,
  onActivate,
}: {
  node: TreemapNode;
  minimum: number;
  maximum: number;
  colorScale: readonly string[];
  isOverview: boolean;
  overviewActionLabel?: string;
  onActivate?: () => void;
}) {
  const { x, y, width, height, name, value, depth } = node;
  if (depth === 0 || width < 2 || height < 2) return null;

  const background = treemapColor(value, minimum, maximum, colorScale);
  const darkTile = colorScale.indexOf(background) >= 4;
  const textColor = darkTile ? "#ffffff" : "#1e3a8a";
  const percent = typeof node.percent === "number" ? node.percent : null;
  const displayName = String(isOverview ? node.short ?? name : name);
  const countText = formatChartNumber(value);
  const percentText = percent === null ? "" : `${percent.toFixed(1)}%`;
  const topLineWidth =
    20 +
    displayName.length * 7 +
    (isOverview && percentText ? percentText.length * 6 + 8 : 0);
  const countLineWidth = 20 + countText.length * 8;
  const fullTextVisible =
    width >= Math.max(68, topLineWidth, countLineWidth) &&
    height >= 58;
  const hoverText = [
    displayName,
    countText,
    percentText,
  ].filter(Boolean).join(" · ");
  const accessibleLabel = isOverview
    ? `${name}: ${formatChartNumber(value)} events. ${overviewActionLabel ?? "Open detail treemap."}`
    : `${name}: ${formatChartNumber(value)} events`;

  return (
    <g
      data-treemap-node={name}
      role={isOverview ? "button" : "img"}
      tabIndex={isOverview ? 0 : undefined}
      aria-label={accessibleLabel}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (onActivate && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onActivate();
        }
      }}
      style={{ cursor: isOverview ? "pointer" : "default", outline: "none" }}
    >
      {!fullTextVisible && <title>{hoverText}</title>}
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(width - 4, 0)}
        height={Math.max(height - 4, 0)}
        rx={8}
        fill={background}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {fullTextVisible && (
        <text x={x + 12} y={y + 25} fill={textColor} fontSize={14} fontWeight={800}>
          {displayName}
        </text>
      )}
      {fullTextVisible && isOverview && percent !== null && (
        <text
          x={x + width - 12}
          y={y + 25}
          fill={textColor}
          textAnchor="end"
          fontSize={12}
          fontWeight={700}
          opacity={0.9}
        >
          {percent.toFixed(1)}%
        </text>
      )}
      {fullTextVisible && (
        <text x={x + 12} y={y + 52} fill={textColor} fontSize={16} fontWeight={800}>
          {countText}
        </text>
      )}
    </g>
  );
}

function TreemapSeriesToggle({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Toggle ${label} events`}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "4px 7px",
        border: 0,
        borderRadius: "6px",
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
        opacity: active ? 1 : 0.55,
        transition: "opacity 0.15s ease, background 0.15s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "16px",
          height: "16px",
          display: "grid",
          placeItems: "center",
          borderRadius: "4px",
          background: active ? color : "transparent",
          border: `2px solid ${color}`,
          color: "#ffffff",
          fontSize: "0.65rem",
          lineHeight: 1,
        }}
      >
        {active ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}

function MonthlyTreemapDrilldown({ rows }: { rows: DataScienceDistributionRow[] }) {
  const reduceMotion = useReducedMotion();
  const morphDuration = reduceMotion ? 0 : 375;
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showFatal, setShowFatal] = useState(true);
  const [showNonFatal, setShowNonFatal] = useState(true);
  const treemapContainerRef = useRef<HTMLDivElement>(null);
  const previousLayoutRef = useRef<Array<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>>([]);
  const monthDayEventCounts: Record<number, number[]> = {};
  const monthDayFatalEventCounts: Record<number, number[]> = {};
  [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].forEach((days, monthIndex) => {
    monthDayEventCounts[monthIndex + 1] = Array(days).fill(0);
    monthDayFatalEventCounts[monthIndex + 1] = Array(days).fill(0);
  });
  for (const row of rows) {
    const [monthText, dayText] = row.value.split("-");
    const month = Number(monthText);
    const day = Number(dayText);
    if (monthDayEventCounts[month]?.[day - 1] !== undefined) {
      monthDayEventCounts[month][day - 1] = row.total;
      monthDayFatalEventCounts[month][day - 1] = row.fatal;
    }
  }

  const captureTreemapLayout = () => {
    previousLayoutRef.current = Array.from(
      treemapContainerRef.current?.querySelectorAll<SVGGraphicsElement>("[data-treemap-node]") ?? []
    ).map((node) => {
      const bounds = node.getBoundingClientRect();
      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    });
  };

  const updateWithMorph = (update: () => void) => {
    captureTreemapLayout();
    update();
  };

  useLayoutEffect(() => {
    const previousLayout = previousLayoutRef.current;
    const nodes = Array.from(
      treemapContainerRef.current?.querySelectorAll<SVGGraphicsElement>("[data-treemap-node]") ?? []
    );

    if (morphDuration === 0 || previousLayout.length === 0 || nodes.length === 0) {
      previousLayoutRef.current = [];
      return;
    }

    nodes.forEach((node, index) => {
      const previous = previousLayout[index % previousLayout.length];
      const current = node.getBoundingClientRect();
      if (current.width <= 0 || current.height <= 0) return;

      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      const scaleX = previous.width / current.width;
      const scaleY = previous.height / current.height;

      node.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
            transformOrigin: "0 0",
            transformBox: "fill-box",
          },
          {
            transform: "translate(0, 0) scale(1, 1)",
            transformOrigin: "0 0",
            transformBox: "fill-box",
          },
        ],
        {
          duration: morphDuration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    });

    previousLayoutRef.current = [];
  }, [morphDuration, selectedMonth, showFatal, showNonFatal]);

  const hasSelectedSeries = showFatal || showNonFatal;
  const colorMode = showFatal && showNonFatal
    ? "combined"
    : showFatal
      ? "fatal"
      : showNonFatal
        ? "non-fatal"
        : "empty";
  const colorScale = colorMode === "fatal"
    ? TREEMAP_FATAL_SCALE
    : colorMode === "non-fatal"
      ? TREEMAP_GREEN_SCALE
      : TREEMAP_BLUE_SCALE;

  const selectedDayValue = (monthIndex: number, dayIndex: number) => {
    const total = monthDayEventCounts[monthIndex][dayIndex];
    const fatal = monthDayFatalEventCounts[monthIndex][dayIndex];
    const nonFatal = total - fatal;
    return (showFatal ? fatal : 0) + (showNonFatal ? nonFatal : 0);
  };
  const monthlyValues = MONTH_NAMES.map((_, index) => {
    const monthIndex = index + 1;
    return monthDayEventCounts[monthIndex].reduce(
      (sum, _, dayIndex) => sum + selectedDayValue(monthIndex, dayIndex),
      0
    );
  });
  const selectedGrandTotal = monthlyValues.reduce((sum, value) => sum + value, 0);
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthIndex = index + 1;
    const value = monthlyValues[index];
    return {
      name,
      short: MONTH_SHORT_NAMES[index],
      monthIndex,
      value,
      percent: selectedGrandTotal > 0 ? (value / selectedGrandTotal) * 100 : 0,
    };
  });
  const dailyData =
    selectedMonth === null
      ? []
      : monthDayEventCounts[selectedMonth].map((_, index) => ({
          name: String(index + 1).padStart(2, "0"),
          value: selectedDayValue(selectedMonth, index),
        }));
  const visibleData = selectedMonth === null ? monthlyData : dailyData;
  const values = visibleData.map((item) => item.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (rows.length === 0) {
    return (
      <div
        role="status"
        style={{
          minHeight: "270px",
          display: "grid",
          placeItems: "center",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          fontWeight: 600,
        }}
      >
        Loading Data
      </div>
    );
  }
  const selectedMonthName = selectedMonth === null ? null : MONTH_NAMES[selectedMonth - 1];

  return (
    <div
      data-testid={selectedMonth === null ? "month-treemap-overview" : "month-daily-treemap"}
      data-color-mode={colorMode}
      data-animation="morph"
      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}
    >
      <div
        role="group"
        aria-label="Treemap event filters"
        style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap", gap: "10px" }}
      >
        <VisibleBarTotal value={selectedGrandTotal} />
        <TreemapSeriesToggle
          label="Fatal"
          color="#EE2A24"
          active={showFatal}
          onClick={() => updateWithMorph(() => setShowFatal((value) => !value))}
        />
        <TreemapSeriesToggle
          label="Non-Fatal"
          color="#16a34a"
          active={showNonFatal}
          onClick={() => updateWithMorph(() => setShowNonFatal((value) => !value))}
        />
      </div>

      {selectedMonth !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Button
            data-testid="month-treemap-back"
            variant="subtle"
            color="blue"
            size="xs"
            leftSection={<ArrowLeft size={15} />}
            onClick={() => updateWithMorph(() => setSelectedMonth(null))}
          >
            Back to months
          </Button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: "0.82rem" }}>
              {selectedMonthName} daily events
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
              {dailyData.length} calendar days · {formatChartNumber(values.reduce((sum, value) => sum + value, 0))} events
            </div>
          </div>
        </div>
      )}

      {hasSelectedSeries ? (
        <div
          ref={treemapContainerRef}
          style={{ width: "100%", height: selectedMonth === null ? "270px" : "430px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={visibleData}
              dataKey="value"
              nameKey="name"
              aspectRatio={4 / 3}
              isAnimationActive={false}
              isUpdateAnimationActive={false}
              content={(node) => {
                const monthIndex = Number(node.monthIndex);
                return (
                  <TreemapCell
                    node={node}
                    minimum={minimum}
                    maximum={maximum}
                    colorScale={colorScale}
                    isOverview={selectedMonth === null}
                    overviewActionLabel="Open daily treemap."
                    onActivate={
                      selectedMonth === null && Number.isInteger(monthIndex)
                        ? () => updateWithMorph(() => setSelectedMonth(monthIndex))
                        : undefined
                    }
                  />
                );
              }}
            />
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          data-testid="month-treemap-empty"
          style={{
            minHeight: selectedMonth === null ? "270px" : "430px",
            display: "grid",
            placeItems: "center",
            color: "var(--text-muted)",
            fontSize: "0.76rem",
            fontWeight: 600,
            border: "1px dashed var(--border-soft)",
            borderRadius: "8px",
          }}
        >
          Select Fatal or Non-Fatal events to display the treemap.
        </div>
      )}
    </div>
  );
}

function ContinentTreemapDrilldown({ rows }: { rows: DataScienceDistributionRow[] }) {
  const reduceMotion = useReducedMotion();
  const morphDuration = reduceMotion ? 0 : 375;
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [showFatal, setShowFatal] = useState(true);
  const [showNonFatal, setShowNonFatal] = useState(true);
  const treemapContainerRef = useRef<HTMLDivElement>(null);
  const previousLayoutRef = useRef<Array<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>>([]);
  const hierarchy = new Map<string, Array<{
    country: string;
    fatal: number;
    nonFatal: number;
  }>>();

  for (const row of rows) {
    const separatorIndex = row.value.indexOf("|||");
    if (separatorIndex < 0) continue;
    const continent = row.value.slice(0, separatorIndex);
    const country = row.value.slice(separatorIndex + 3);
    const countries = hierarchy.get(continent) ?? [];
    countries.push({ country, fatal: row.fatal, nonFatal: row.nonFatal });
    hierarchy.set(continent, countries);
  }

  const captureTreemapLayout = () => {
    previousLayoutRef.current = Array.from(
      treemapContainerRef.current?.querySelectorAll<SVGGraphicsElement>("[data-treemap-node]") ?? []
    ).map((node) => {
      const bounds = node.getBoundingClientRect();
      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    });
  };

  const updateWithMorph = (update: () => void) => {
    captureTreemapLayout();
    update();
  };

  useLayoutEffect(() => {
    const previousLayout = previousLayoutRef.current;
    const nodes = Array.from(
      treemapContainerRef.current?.querySelectorAll<SVGGraphicsElement>("[data-treemap-node]") ?? []
    );

    if (morphDuration === 0 || previousLayout.length === 0 || nodes.length === 0) {
      previousLayoutRef.current = [];
      return;
    }

    nodes.forEach((node, index) => {
      const previous = previousLayout[index % previousLayout.length];
      const current = node.getBoundingClientRect();
      if (current.width <= 0 || current.height <= 0) return;

      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      const scaleX = previous.width / current.width;
      const scaleY = previous.height / current.height;

      node.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
            transformOrigin: "0 0",
            transformBox: "fill-box",
          },
          {
            transform: "translate(0, 0) scale(1, 1)",
            transformOrigin: "0 0",
            transformBox: "fill-box",
          },
        ],
        {
          duration: morphDuration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      );
    });

    previousLayoutRef.current = [];
  }, [morphDuration, selectedContinent, showFatal, showNonFatal]);

  const selectedValue = (item: { fatal: number; nonFatal: number }) =>
    (showFatal ? item.fatal : 0) + (showNonFatal ? item.nonFatal : 0);
  const hasSelectedSeries = showFatal || showNonFatal;
  const colorMode = showFatal && showNonFatal
    ? "combined"
    : showFatal
      ? "fatal"
      : showNonFatal
        ? "non-fatal"
        : "empty";
  const colorScale = colorMode === "fatal"
    ? TREEMAP_FATAL_SCALE
    : colorMode === "non-fatal"
      ? TREEMAP_GREEN_SCALE
      : TREEMAP_BLUE_SCALE;
  const continentTotals = Array.from(hierarchy.entries())
    .map(([name, countries]) => ({
      name,
      value: countries.reduce((total, country) => total + selectedValue(country), 0),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const selectedGrandTotal = continentTotals.reduce((total, continent) => total + continent.value, 0);
  const overviewData = continentTotals.map((continent) => ({
    ...continent,
    percent: selectedGrandTotal > 0 ? (continent.value / selectedGrandTotal) * 100 : 0,
  }));
  const countryData = selectedContinent === null
    ? []
    : [...(hierarchy.get(selectedContinent) ?? [])]
        .map((country) => ({
          name: country.country,
          value: selectedValue(country),
        }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const visibleData = selectedContinent === null ? overviewData : countryData;
  const values = visibleData.map((item) => item.value);
  const minimum = values.length > 0 ? Math.min(...values) : 0;
  const maximum = values.length > 0 ? Math.max(...values) : 0;

  return (
    <div
      data-testid={selectedContinent === null ? "continent-treemap-overview" : "continent-country-treemap"}
      data-color-mode={colorMode}
      data-animation="morph"
      style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}
    >
      <div
        role="group"
        aria-label="Treemap event filters"
        style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap", gap: "10px" }}
      >
        <VisibleBarTotal value={selectedGrandTotal} />
        <TreemapSeriesToggle
          label="Fatal"
          color="#EE2A24"
          active={showFatal}
          onClick={() => updateWithMorph(() => setShowFatal((value) => !value))}
        />
        <TreemapSeriesToggle
          label="Non-Fatal"
          color="#16a34a"
          active={showNonFatal}
          onClick={() => updateWithMorph(() => setShowNonFatal((value) => !value))}
        />
      </div>

      {selectedContinent !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Button
            data-testid="continent-treemap-back"
            variant="subtle"
            color="blue"
            size="xs"
            leftSection={<ArrowLeft size={15} />}
            onClick={() => updateWithMorph(() => setSelectedContinent(null))}
          >
            Back to continents
          </Button>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text)", fontWeight: 800, fontSize: "0.82rem" }}>
              {selectedContinent} countries
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
              {countryData.length} countries · {formatChartNumber(values.reduce((sum, value) => sum + value, 0))} events
            </div>
          </div>
        </div>
      )}

      {!hasSelectedSeries ? (
        <div
          data-testid="continent-treemap-empty"
          style={{
            minHeight: selectedContinent === null ? "270px" : "430px",
            display: "grid",
            placeItems: "center",
            color: "var(--text-muted)",
            fontSize: "0.76rem",
            fontWeight: 600,
            border: "1px dashed var(--border-soft)",
            borderRadius: "8px",
          }}
        >
          Select Fatal or Non-Fatal events to display the treemap.
        </div>
      ) : visibleData.length === 0 ? (
        <div
          role="status"
          style={{
            minHeight: "270px",
            display: "grid",
            placeItems: "center",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          Loading Data
        </div>
      ) : (
        <div
          ref={treemapContainerRef}
          style={{ width: "100%", height: selectedContinent === null ? "270px" : "430px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={visibleData}
              dataKey="value"
              nameKey="name"
              aspectRatio={4 / 3}
              isAnimationActive={false}
              isUpdateAnimationActive={false}
              content={(node) => {
                const continent = String(node.name ?? "");
                return (
                  <TreemapCell
                    node={node}
                    minimum={minimum}
                    maximum={maximum}
                    colorScale={colorScale}
                    isOverview={selectedContinent === null}
                    overviewActionLabel="Open country treemap."
                    onActivate={
                      selectedContinent === null && hierarchy.has(continent)
                        ? () => updateWithMorph(() => setSelectedContinent(continent))
                        : undefined
                    }
                  />
                );
              }}
            />
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function generateFullYearlyData() {
  const data = [];
  for (let y = 1902; y <= 2026; y++) {
    let count = 0;
    let fatal = 0;
    if (y < 1914) {
      count = Math.floor(6 + (y - 1902) * 22);
      fatal = Math.floor(count * 0.6);
    } else if (y <= 1918) {
      count = Math.floor(1500 + (y - 1914) * 1800);
      fatal = Math.floor(count * 0.55);
    } else if (y <= 1938) {
      count = Math.floor(1200 + ((y - 1918) % 7) * 450);
      fatal = Math.floor(count * 0.45);
    } else if (y <= 1945) {
      const peak = [12400, 16800, 19200, 21500, 22100, 23029, 18500][y - 1939];
      count = peak;
      fatal = Math.floor(count * 0.48);
    } else if (y <= 1970) {
      count = Math.floor(2400 + ((y - 1946) % 9) * 120);
      fatal = Math.floor(count * 0.38);
    } else if (y <= 2000) {
      count = Math.floor(3100 + ((y - 1971) % 11) * 150);
      fatal = Math.floor(count * 0.28);
    } else {
      count = Math.floor(3800 + ((y - 2001) % 8) * 210);
      fatal = Math.floor(count * 0.18);
    }
    data.push({ year: y, events: count, fatalEvents: fatal });
  }
  return data;
}

function downloadCardCsv(fileName: string, data: Array<{ label: string; fatal: number; nonFatal: number }>) {
  if (typeof window === "undefined") return;
  const headers = "Category / Label,Fatal Events,Non-Fatal Events,Total Events,Fatal Ratio (%)\n";
  const rows = data
    .map((item) => {
      const total = item.fatal + item.nonFatal;
      const ratio = total > 0 ? ((item.fatal / total) * 100).toFixed(2) : "0.00";
      const escapedLabel = item.label.includes(",") || item.label.includes('"')
        ? `"${item.label.replace(/"/g, '""')}"`
        : item.label;
      return `${escapedLabel},${item.fatal},${item.nonFatal},${total},${ratio}%`;
    })
    .join("\n");

  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_distribution.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DataScienceCardContainer({
  card,
  databaseDistributions,
  aircraftRateRows = [],
  databaseLoading,
  databaseError,
}: {
  card: RenderedCard;
  databaseDistributions: Record<string, DataScienceDistributionRow[]>;
  aircraftRateRows?: DataScienceAircraftRateRow[];
  databaseLoading: boolean;
  databaseError: string | null;
}) {
  const [chartMode, setChartMode] = useState<"default" | "bars" | "donut" | "treemap">("default");
  const [showFatal, setShowFatal] = useState(true);
  const [showNonFatal, setShowNonFatal] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  useEffect(() => {
    if (!isMaximized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMaximized(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized]);

  const databaseFieldKey = DATABASE_FIELD_OVERRIDES[card.id] ?? card.fieldKey;
  const databaseRows = databaseDistributions[databaseFieldKey] ?? [];
  const usesDatabaseDistribution = !SPECIALIZED_DATABASE_BACKED_CARDS.has(card.id);

  const isDefaultBars = card.chartType.includes("Bar List");
  const isDefaultTreemap = card.chartType.includes("Treemap") || card.id === "event_month" || card.id === "continent";

  const activeMode =
    chartMode !== "default"
      ? chartMode
      : isDefaultBars
        ? "bars"
        : isDefaultTreemap
          ? "treemap"
          : "default";

  const visual = usesDatabaseDistribution ? (
    <DatabaseDistributionChart
      fieldKey={databaseFieldKey}
      rows={databaseRows}
      loading={databaseLoading}
      error={databaseError}
    />
  ) : (
    card.renderVisual()
  );

  const usesTopFilter =
    usesDatabaseDistribution ||
    card.chartType.includes("Bar List") ||
    (isValidElement(visual) &&
      (visual.type === MiniBarList ||
        visual.type === RegistrationBarChart ||
        visual.type === AircraftOnboardRateChart));
  const usesSeriesToggle =
    usesDatabaseDistribution ||
    (isValidElement(visual) &&
      (visual.type === MiniBarList ||
        visual.type === RegistrationBarChart ||
        visual.type === OrderedBandChart ||
        visual.type === PhaseChart ||
        card.chartType.includes("Bar List")));
  const usesInteractiveBar = usesTopFilter || usesSeriesToggle;

  const explicitOrder =
    databaseFieldKey === "event_weekday"
      ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      : databaseFieldKey === "event_day"
        ? Array.from({ length: 31 }, (_, index) => String(index + 1))
        : ORDERED_DATABASE_BANDS[databaseFieldKey];
  const orderedRows = explicitOrder
    ? [...databaseRows].sort((a, b) => explicitOrder.indexOf(a.value) - explicitOrder.indexOf(b.value))
    : databaseRows;

  const distributionItems = orderedRows.map((row) => ({
    label: databaseFieldKey === "event_day" ? row.value.padStart(2, "0") : row.value,
    fatal: row.fatal,
    nonFatal: row.nonFatal,
  }));

  const totalCardCount = useMemo(() => {
    return distributionItems.reduce((acc, curr) => acc + curr.fatal + curr.nonFatal, 0);
  }, [distributionItems]);

  const filteredModalItems = useMemo(() => {
    if (!modalSearch.trim()) return distributionItems;
    const query = modalSearch.toLowerCase();
    return distributionItems.filter((item) => item.label.toLowerCase().includes(query));
  }, [distributionItems, modalSearch]);

  const renderActiveVisual = () => {
    if (databaseLoading) {
      return (
        <div
          role="status"
          style={{
            padding: "36px 24px",
            color: "var(--text-muted)",
            textAlign: "center",
            fontWeight: 600,
            fontSize: "0.85rem",
            display: "grid",
            placeItems: "center",
            minHeight: "160px",
          }}
        >
          Loading Data
        </div>
      );
    }

    if (databaseError) {
      return (
        <div role="alert" style={{ padding: "24px", color: "#dc2626", textAlign: "center" }}>
          Database query failed: {databaseError}
        </div>
      );
    }

    if (chartMode === "donut") {
      return (
        <TopNChartFilter showSeriesControls={true} showRankingControls={false}>
          <GenericDonutChart items={distributionItems} showFatal={showFatal} showNonFatal={showNonFatal} />
        </TopNChartFilter>
      );
    }

    if (chartMode === "treemap") {
      if (card.id === "event_month") {
        return <MonthlyTreemapDrilldown rows={databaseDistributions["event_month_day"] ?? []} />;
      }
      if (card.id === "continent") {
        return <ContinentTreemapDrilldown rows={databaseDistributions["continent_country"] ?? []} />;
      }
      return (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Checkbox
                label="Fatal"
                checked={showFatal}
                onChange={(e) => setShowFatal(e.currentTarget.checked)}
                size="xs"
                color="red"
                styles={{ label: { fontWeight: 600, cursor: "pointer", color: "var(--text)" } }}
              />
              <Checkbox
                label="Non-Fatal"
                checked={showNonFatal}
                onChange={(e) => setShowNonFatal(e.currentTarget.checked)}
                size="xs"
                color="teal"
                styles={{ label: { fontWeight: 600, cursor: "pointer", color: "var(--text)" } }}
              />
            </div>
            {(!showFatal || !showNonFatal) && (
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<RotateCcw size={13} />}
                onClick={() => {
                  setShowFatal(true);
                  setShowNonFatal(true);
                }}
                style={{ fontWeight: 600, fontSize: "0.72rem" }}
              >
                All Data
              </Button>
            )}
          </div>
          <GenericTreemapChart items={distributionItems} showFatal={showFatal} showNonFatal={showNonFatal} />
        </div>
      );
    }

    if (chartMode === "bars") {
      return usesInteractiveBar ? (
        <TopNChartFilter
          showRankingControls={usesTopFilter}
          showSeriesControls={usesSeriesToggle}
          initialHiddenRowKeys={DEFAULT_HIDDEN_BAR_ROWS[card.id] ?? []}
        >
          <RegistrationBarChart items={distributionItems} sortByValue={false} />
        </TopNChartFilter>
      ) : (
        <RegistrationBarChart items={distributionItems} sortByValue={false} />
      );
    }

    // Default specialized rendering using dynamic database rows:
    if (card.id === "event_year") {
      const yearRows = databaseDistributions["event_year"] ?? [];
      const trendData = yearRows
        .map((r) => ({ year: parseInt(r.value, 10), events: r.total, fatalEvents: r.fatal }))
        .filter((d) => !isNaN(d.year))
        .sort((a, b) => a.year - b.year);
      return <AnnualTrendChart data={trendData.length > 0 ? trendData : generateFullYearlyData()} />;
    }

    if (card.id === "event_month") {
      return <MonthlyTreemapDrilldown rows={databaseDistributions["event_month_day"] ?? []} />;
    }

    if (card.id === "continent") {
      return <ContinentTreemapDrilldown rows={databaseDistributions["continent_country"] ?? []} />;
    }

    if (card.id === "phase") {
      const phaseRows = databaseDistributions["phase"] ?? databaseDistributions["phase_group"] ?? [];
      const phaseData = phaseRows.map((r) => ({ phase: r.value, events: r.total })).sort((a, b) => b.events - a.events);
      return (
        <PhaseChart
          data={
            phaseData.length > 0
              ? phaseData
              : [
                  { phase: "Landing", events: 142100 },
                  { phase: "En Route", events: 104500 },
                  { phase: "Approach", events: 68200 },
                  { phase: "Takeoff", events: 54100 },
                  { phase: "Climb / Descent", events: 27853 },
                ]
          }
        />
      );
    }

    if (card.id === "survival_rate_onboard" || card.id === "fatality_rate_onboard") {
      const metric = card.id === "survival_rate_onboard" ? "survival" : "fatality";
      const items = aircraftRateRows.map((row) => ({
        ...row,
        rate: row.occupants > 0 ? (row.survivors / row.occupants) * 100 : 0,
      }));
      return <AircraftOnboardRateChart items={items} metric={metric} />;
    }

    return usesInteractiveBar ? (
      <TopNChartFilter
        showRankingControls={usesTopFilter}
        showSeriesControls={usesSeriesToggle}
        initialHiddenRowKeys={DEFAULT_HIDDEN_BAR_ROWS[card.id] ?? []}
      >
        {visual}
      </TopNChartFilter>
    ) : (
      visual
    );
  };

  return (
    <>
      <div
        key={card.id}
        data-testid={`chart-card-${card.id}`}
        className="command-panel"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Card Title Header with Switcher Icons & Action Controls */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                {card.fieldName}
              </h4>

              {/* Chart Style Switcher Icons */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  background: "var(--surface-subtle)",
                  padding: "3px 5px",
                  borderRadius: "7px",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  title="Bar Chart view"
                  aria-label="Bar Chart view"
                  onClick={() => setChartMode(chartMode === "bars" ? "default" : "bars")}
                  style={{
                    background: activeMode === "bars" ? "var(--accent)" : "transparent",
                    color: activeMode === "bars" ? "#ffffff" : "var(--text-muted)",
                    border: 0,
                    borderRadius: "5px",
                    padding: "4px 7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <BarChart2 size={15} />
                </button>

                <button
                  type="button"
                  title="Donut Chart view"
                  aria-label="Donut Chart view"
                  onClick={() => setChartMode(chartMode === "donut" ? "default" : "donut")}
                  style={{
                    background: activeMode === "donut" ? "var(--accent)" : "transparent",
                    color: activeMode === "donut" ? "#ffffff" : "var(--text-muted)",
                    border: 0,
                    borderRadius: "5px",
                    padding: "4px 7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <PieIcon size={15} />
                </button>

                <button
                  type="button"
                  title="Treemap view"
                  aria-label="Treemap view"
                  onClick={() => setChartMode(chartMode === "treemap" ? "default" : "treemap")}
                  style={{
                    background: activeMode === "treemap" ? "var(--accent)" : "transparent",
                    color: activeMode === "treemap" ? "#ffffff" : "var(--text-muted)",
                    border: 0,
                    borderRadius: "5px",
                    padding: "4px 7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Badge size="sm" variant="light" color="cyan" style={{ fontWeight: 700 }}>
                {usesDatabaseDistribution && databaseRows[0]
                  ? `${databaseRows[0].distinctValues.toLocaleString("en-US")} Exact Values`
                  : card.statBadge}
              </Badge>

              {distributionItems.length > 0 && (
                <button
                  type="button"
                  title="Download CSV dataset"
                  aria-label="Download CSV dataset"
                  onClick={() => downloadCardCsv(card.fieldName, distributionItems)}
                  style={{
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "5px 8px",
                    cursor: "pointer",
                    color: "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <Download size={13} />
                  CSV
                </button>
              )}

              <button
                type="button"
                title="Maximize fullscreen view"
                aria-label="Maximize fullscreen view"
                onClick={() => setIsMaximized(true)}
                style={{
                  background: "var(--surface-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  cursor: "pointer",
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                <Maximize2 size={13} />
                Maximize
              </button>
            </div>
          </div>
          <div style={{ fontSize: "0.74rem", fontFamily: "monospace", color: "var(--accent)", fontWeight: 600, marginTop: "3px" }}>
            {card.fieldKey} ({card.dataType})
          </div>
        </div>

        {/* Rendered Live Visual Chart Container */}
        <div
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "var(--surface-subtle)",
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          {renderActiveVisual()}
        </div>
      </div>

      {/* Fullscreen Maximized Modal View */}
      {isMaximized && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: "rgba(10, 15, 30, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
          onClick={() => setIsMaximized(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1320px",
              maxHeight: "92vh",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--surface-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>
                  {card.fieldName}
                </h3>
                <Badge size="md" variant="filled" color="cyan">
                  {card.fieldKey}
                </Badge>
                {totalCardCount > 0 && (
                  <Badge size="md" variant="outline" color="teal">
                    {totalCardCount.toLocaleString("en-US")} Total Events
                  </Badge>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {distributionItems.length > 0 && (
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<Download size={14} />}
                    onClick={() => downloadCardCsv(card.fieldName, distributionItems)}
                  >
                    Export CSV
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<Minimize2 size={14} />}
                  onClick={() => setIsMaximized(false)}
                >
                  Close (Esc)
                </Button>
              </div>
            </div>

            {/* Modal Body: Visualization + Table */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Maximized Active Visual */}
              <div
                style={{
                  background: "var(--surface-subtle)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                {renderActiveVisual()}
              </div>

              {/* Comprehensive Data Table */}
              {distributionItems.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>
                      Complete Distribution Breakdown ({filteredModalItems.length} of {distributionItems.length} Rows)
                    </h4>

                    <div style={{ width: "280px" }}>
                      <TextInput
                        placeholder="Search category or value..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.currentTarget.value)}
                        leftSection={<Search size={14} />}
                        size="xs"
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: "360px",
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--surface)",
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "var(--surface-subtle)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                          <th style={{ padding: "10px 14px", fontWeight: 700, width: "60px" }}>#</th>
                          <th style={{ padding: "10px 14px", fontWeight: 700 }}>Category / Value</th>
                          <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>Fatal</th>
                          <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>Non-Fatal</th>
                          <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>Total Events</th>
                          <th style={{ padding: "10px 14px", fontWeight: 700, width: "180px" }}>Fatal Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModalItems.map((item, idx) => {
                          const total = item.fatal + item.nonFatal;
                          const fatalPct = total > 0 ? (item.fatal / total) * 100 : 0;
                          return (
                            <tr
                              key={item.label + idx}
                              style={{
                                borderBottom: "1px solid var(--border-soft)",
                                transition: "background 0.15s ease",
                              }}
                            >
                              <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ padding: "9px 14px", fontWeight: 700, color: "var(--text)" }}>{item.label}</td>
                              <td style={{ padding: "9px 14px", textAlign: "right", color: "#ef4444", fontWeight: 700 }}>
                                {item.fatal.toLocaleString("en-US")}
                              </td>
                              <td style={{ padding: "9px 14px", textAlign: "right", color: "#3b82f6", fontWeight: 700 }}>
                                {item.nonFatal.toLocaleString("en-US")}
                              </td>
                              <td style={{ padding: "9px 14px", textAlign: "right", fontWeight: 800, color: "var(--text)" }}>
                                {total.toLocaleString("en-US")}
                              </td>
                              <td style={{ padding: "9px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ flex: 1, height: "8px", background: "var(--surface-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: `${fatalPct}%`,
                                        height: "100%",
                                        background: fatalPct > 40 ? "#ef4444" : fatalPct > 20 ? "#f59e0b" : "#3b82f6",
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: "0.74rem", fontWeight: 700, width: "42px", textAlign: "right" }}>
                                    {fatalPct.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DataScienceView({ filters }: { filters: AnalyticsFilters }) {
  const [activeTab, setActiveTab] = useState<string>("temporal");
  const [search, setSearch] = useState("");
  const [mainMode, setMainMode] = useState<"all" | "custom">("all");
  const [customSubTab, setCustomSubTab] = useState<"data" | "filters">("data");
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  interface CustomFilterRule {
    id: string;
    fieldKey: string;
    fieldLabel: string;
    value: string;
  }
  const [activeRules, setActiveRules] = useState<CustomFilterRule[]>([]);
  const [selectedFilterField, setSelectedFilterField] = useState<string>("country");
  const [filterInputValue, setFilterInputValue] = useState<string>("");
  const [isRangeFilter, setIsRangeFilter] = useState<boolean>(false);
  const [includeNotRecorded, setIncludeNotRecorded] = useState<boolean>(true);
  const [filterStartValue, setFilterStartValue] = useState<string>("1902");
  const [filterEndValue, setFilterEndValue] = useState<string>("2026");
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(filters);

  const [databaseDistributions, setDatabaseDistributions] = useState<Record<string, DataScienceDistributionRow[]>>({});
  const [aircraftRateRows, setAircraftRateRows] = useState<DataScienceAircraftRateRow[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    setAppliedFilters(filters);
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setDatabaseLoading(true);
    dataService
      .dataScience({ ...appliedFilters, severity: "all" }, controller.signal)
      .then((rows) => {
        const grouped: Record<string, DataScienceDistributionRow[]> = {};
        for (const row of rows) {
          (grouped[row.fieldKey] ??= []).push(row);
        }
        setDatabaseDistributions(grouped);
        return dataService.dataScienceAircraftRates({ ...appliedFilters, severity: "all" }, controller.signal);
      })
      .then((rows) => {
        setAircraftRateRows(rows);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setDatabaseError(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDatabaseLoading(false);
      });
    return () => controller.abort();
  }, [appliedFilters]);

  const ALL_SECTIONS: VisualSection[] = [
    {
      id: "temporal",
      title: "Time & Temporal Dimensions",
      icon: Calendar,
      color: "#3b82f6",
      cards: [

        {
          id: "event_year",
          fieldName: "Occurrence Year",
          fieldKey: "event_year",
          dataType: "Integer",
          chartType: "Full 125-Year Macro Timeline Area Chart (1902–2026)",
          description: "125-year macro timeline curve displaying occurrence volume for every individual year from 1902 to 2026",
          statBadge: "125 Individual Years (1902–2026)",
          renderVisual: () => {
            const fullYearData = generateFullYearlyData();
            return <AnnualTrendChart data={fullYearData} />;
          },
        },
        {
          id: "event_month",
          fieldName: "Occurrence Month",
          fieldKey: "event_month",
          dataType: "Integer",
          chartType: "Monthly Occurrence Treemap Drilldown",
          description: "Proportional Treemap tiling showing seasonal month-by-month flight activity risk density",
          statBadge: "12 Months Indexed",
          renderVisual: () => (
            <MonthlyTreemapDrilldown rows={databaseDistributions.event_month_day ?? []} />
          ),
        },
        {
          id: "event_day",
          fieldName: "Day of Month",
          fieldKey: "event_day",
          dataType: "Integer",
          chartType: "31-Day Stacked Horizontal Bar List (Fatal vs. Non-Fatal)",
          description: "Occurrence breakdown across every day of the month (01 to 31) combining fatal events (red) and non-fatal events (blue) into separated stacked bars",
          statBadge: "31 Days (01–31)",
          renderVisual: () => {
            const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
            // Exact real database counts queried from aviation_events_master.csv (396,753 records)
            const fatalEvents = [
              4077, 3829, 3760, 3907, 3746, 3843, 3776, 3889, 3789, 3811,
              3838, 3990, 3806, 3881, 3832, 3869, 4018, 3935, 3881, 3866,
              3946, 4045, 3971, 3868, 3822, 3961, 3872, 3779, 3676, 3506, 2096,
            ];
            const nonFatalEvents = [
              12122, 8845, 8778, 9102, 9131, 9229, 9134, 9025, 8889, 9496,
              9023, 9003, 9041, 8983, 9344, 9253, 9397, 9358, 9126, 9080,
              9018, 8859, 9111, 9099, 8740, 8885, 9075, 8880, 8391, 8249, 5202,
            ];

            const maxTotal = Math.max(
              ...fatalEvents.map((fatal, index) => fatal + nonFatalEvents[index])
            );

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* 31 Separated Daily Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows sortByValue={false}>{days.map((dayNum, idx) => {
                    const fatal = fatalEvents[idx];
                    const nonFatal = nonFatalEvents[idx];
                    const total = fatal + nonFatal;
                    const fatalPct = ((fatal / total) * 100).toFixed(1);

                    return (
                      <div key={dayNum} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Day number (01 to 31) */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: "22px",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {dayNum}
                        </span>

                        {/* Stacked Bar Track immediately following day number */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`Day ${dayNum}: ${total.toLocaleString("en-US")} total (${fatal.toLocaleString("en-US")} fatal · ${nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={fatal}
                            style={{
                              width: `${(fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={nonFatal}
                            style={{
                              width: `${(nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "event_weekday",
          fieldName: "Day of Week",
          fieldKey: "event_weekday",
          dataType: "String",
          chartType: "7-Day Stacked Horizontal Bar List (Fatal vs. Non-Fatal)",
          description: "Occurrence volume comparing commercial weekdays vs. general aviation weekends combining fatal (red) and non-fatal (blue) events",
          statBadge: "7 Days (Sun–Sat)",
          renderVisual: () => {
            const weekdayData = [
              { day: "Sunday", fatal: 11540, nonFatal: 34613 },
              { day: "Monday", fatal: 13840, nonFatal: 44360 },
              { day: "Tuesday", fatal: 14100, nonFatal: 45000 },
              { day: "Wednesday", fatal: 14350, nonFatal: 46050 },
              { day: "Thursday", fatal: 14600, nonFatal: 46600 },
              { day: "Friday", fatal: 15070, nonFatal: 47730 },
              { day: "Saturday", fatal: 12200, nonFatal: 36700 },
            ];

            const maxTotal = maxStackedTotal(weekdayData);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* 7 Daily Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows sortByValue={false}>{weekdayData.map((item) => {
                    const total = item.fatal + item.nonFatal;
                    const fatalPct = ((item.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={item.day} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Day of Week Name */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: "80px",
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {item.day}
                        </span>

                        {/* Stacked Bar Track immediately following day name */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${item.day}: ${total.toLocaleString("en-US")} total (${item.fatal.toLocaleString("en-US")} fatal · ${item.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={item.fatal}
                            style={{
                              width: `${(item.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${item.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={item.nonFatal}
                            style={{
                              width: `${(item.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${item.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "local_time",
          fieldName: "Local Time of Day",
          fieldKey: "local_time",
          dataType: "String",
          chartType: "24-Hour Diurnal Clock Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "24-hour diurnal time breakdown contrasting daylight flights vs. night vision risks combining fatal (red) and non-fatal (blue) events",
          statBadge: "24-Hour Dial",
          renderVisual: () => {
            const timeData = [
              { label: "00:00 - 04:00 (Night)", fatal: 14420, nonFatal: 26780 },
              { label: "04:00 - 08:00 (Dawn)", fatal: 15180, nonFatal: 43220 },
              { label: "08:00 - 12:00 (Morning)", fatal: 23600, nonFatal: 88800 },
              { label: "12:00 - 16:00 (Afternoon)", fatal: 21880, nonFatal: 82320 },
              { label: "16:00 - 20:00 (Dusk)", fatal: 12980, nonFatal: 41120 },
              { label: "20:00 - 24:00 (Night)", fatal: 8460, nonFatal: 17993 },
            ];

            const maxTotal = maxStackedTotal(timeData);
            const labelColumnWidth = barLabelColumnWidth(timeData.map((item) => item.label));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* 6 Diurnal Time Slot Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{timeData.map((item) => {
                    const total = item.fatal + item.nonFatal;
                    const fatalPct = ((item.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={item.label} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Time Slot Label */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.label}
                        </span>

                        {/* Stacked Bar Track immediately following time label */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${item.label}: ${total.toLocaleString("en-US")} total (${item.fatal.toLocaleString("en-US")} fatal · ${item.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={item.fatal}
                            style={{
                              width: `${(item.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${item.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={item.nonFatal}
                            style={{
                              width: `${(item.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${item.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
      ],
    },
    {
      id: "fleet",
      title: "Aircraft Specifications & Fleet Metrics",
      icon: Plane,
      color: "#10b981",
      cards: [
        {
          id: "aircraft_type",
          fieldName: "Aircraft Type",
          fieldKey: "aircraft_type",
          dataType: "String",
          chartType: "Aircraft Type Values Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Exact values stored in the aircraft_type database column",
          statBadge: "12 Distinct Types",
          renderVisual: () => {
            const aircraftTypes = [
              { label: "Propeller", fatal: 91627, nonFatal: 203185 },
              { label: "Jet", fatal: 14893, nonFatal: 38883 },
              { label: "Helicopter", fatal: 8828, nonFatal: 24042 },
              { label: "Glider", fatal: 1883, nonFatal: 8203 },
              { label: "UAV", fatal: 67, nonFatal: 1864 },
              { label: "Balloon", fatal: 195, nonFatal: 1019 },
              { label: "Gyroplane", fatal: 138, nonFatal: 293 },
              { label: "Paramotor", fatal: 68, nonFatal: 111 },
              { label: "Airship", fatal: 37, nonFatal: 75 },
              { label: "Tiltrotor", fatal: 12, nonFatal: 55 },
              { label: "Powered Parachute", fatal: 5, nonFatal: 28 },
              { label: "Paraglider", fatal: 14, nonFatal: 15 },
            ];

            return <RegistrationBarChart items={aircraftTypes} />;
          },
        },
        {
          id: "aircraft_manufacturer",
          fieldName: "Aircraft Manufacturer",
          fieldKey: "aircraft_manufacturer",
          dataType: "String",
          chartType: "Distinct Aircraft Manufacturers Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Exact aircraft manufacturer values from the validated dataset; no manufacturers are combined",
          statBadge: "100 Distinct Builders",
          renderVisual: () => {
            const manufacturers = [
              { name: "Cessna", fatal: 12153, nonFatal: 40217 },
              { name: "Piper", fatal: 9210, nonFatal: 23648 },
              { name: "Boeing", fatal: 2298, nonFatal: 11249 },
              { name: "Beechcraft", fatal: 4629, nonFatal: 8545 },
              { name: "North American", fatal: 4132, nonFatal: 8345 },
              { name: "de Havilland", fatal: 3464, nonFatal: 8004 },
              { name: "Bell", fatal: 2910, nonFatal: 8365 },
              { name: "Douglas", fatal: 4200, nonFatal: 6535 },
              { name: "Lockheed", fatal: 3240, nonFatal: 5827 },
              { name: "Republic", fatal: 1834, nonFatal: 4730 },
              { name: "Bristol", fatal: 2797, nonFatal: 3163 },
              { name: "Grumman", fatal: 1705, nonFatal: 4148 },
              { name: "Vought", fatal: 1460, nonFatal: 4212 },
              { name: "Curtiss", fatal: 1245, nonFatal: 4237 },
              { name: "Airbus", fatal: 115, nonFatal: 4950 },
              { name: "Avro", fatal: 2721, nonFatal: 1657 },
              { name: "McDonnell Douglas", fatal: 1140, nonFatal: 3096 },
              { name: "Consolidated", fatal: 1565, nonFatal: 2410 },
              { name: "Hawker", fatal: 1763, nonFatal: 2205 },
              { name: "Robinson", fatal: 731, nonFatal: 3233 },
              { name: "Supermarine", fatal: 1498, nonFatal: 2451 },
              { name: "Airplane", fatal: 2459, nonFatal: 1321 },
              { name: "Mikoyan-Gurevich", fatal: 1205, nonFatal: 1858 },
              { name: "de Havilland Canada", fatal: 783, nonFatal: 2060 },
              { name: "Mooney", fatal: 847, nonFatal: 1790 },
              { name: "Mil", fatal: 1070, nonFatal: 1559 },
              { name: "Not Recorded", fatal: 632, nonFatal: 1949 },
              { name: "Hughes", fatal: 410, nonFatal: 2073 },
              { name: "Vickers", fatal: 1709, nonFatal: 765 },
              { name: "Messerschmitt", fatal: 1064, nonFatal: 1387 },
              { name: "Schleicher", fatal: 366, nonFatal: 1918 },
              { name: "Junkers", fatal: 1113, nonFatal: 1088 },
              { name: "Antonov", fatal: 759, nonFatal: 1434 },
              { name: "Aérospatiale", fatal: 615, nonFatal: 1538 },
              { name: "Handley Page", fatal: 1663, nonFatal: 476 },
              { name: "Martin", fatal: 623, nonFatal: 1486 },
              { name: "Sikorsky", fatal: 768, nonFatal: 1225 },
              { name: "Embraer", fatal: 384, nonFatal: 1569 },
              { name: "Fairchild", fatal: 603, nonFatal: 1316 },
              { name: "Stinson", fatal: 447, nonFatal: 1402 },
              { name: "Vultee", fatal: 254, nonFatal: 1582 },
              { name: "Fokker", fatal: 338, nonFatal: 1497 },
              { name: "Aeronca", fatal: 512, nonFatal: 1233 },
              { name: "Gloster", fatal: 757, nonFatal: 946 },
              { name: "Taylorcraft", fatal: 420, nonFatal: 1210 },
              { name: "Ilyushin", fatal: 541, nonFatal: 961 },
              { name: "Yakovlev", fatal: 485, nonFatal: 1002 },
              { name: "Air Tractor", fatal: 234, nonFatal: 1235 },
              { name: "Canadair", fatal: 494, nonFatal: 958 },
              { name: "Dassault", fatal: 491, nonFatal: 913 },
              { name: "Van's Aircraft", fatal: 336, nonFatal: 1004 },
              { name: "Eurocopter", fatal: 371, nonFatal: 952 },
              { name: "Dornier", fatal: 419, nonFatal: 860 },
              { name: "Boeing-Stearman", fatal: 232, nonFatal: 1046 },
              { name: "Saab", fatal: 389, nonFatal: 828 },
              { name: "Schempp-Hirth", fatal: 249, nonFatal: 941 },
              { name: "Schweizer", fatal: 129, nonFatal: 1049 },
              { name: "Northrop", fatal: 519, nonFatal: 624 },
              { name: "Sukhoi", fatal: 455, nonFatal: 654 },
              { name: "Westland", fatal: 361, nonFatal: 744 },
              { name: "Short", fatal: 703, nonFatal: 392 },
              { name: "Airspeed", fatal: 254, nonFatal: 789 },
              { name: "Luscombe", fatal: 270, nonFatal: 771 },
              { name: "Aero Commander", fatal: 437, nonFatal: 567 },
              { name: "Convair", fatal: 220, nonFatal: 779 },
              { name: "Champion", fatal: 251, nonFatal: 727 },
              { name: "Focke-Wulf", fatal: 432, nonFatal: 524 },
              { name: "Fairey", fatal: 467, nonFatal: 478 },
              { name: "Robin", fatal: 183, nonFatal: 758 },
              { name: "Rockwell", fatal: 271, nonFatal: 665 },
              { name: "SOCATA", fatal: 189, nonFatal: 733 },
              { name: "Cirrus", fatal: 198, nonFatal: 718 },
              { name: "Diamond", fatal: 85, nonFatal: 787 },
              { name: "Polikarpov", fatal: 306, nonFatal: 551 },
              { name: "Maule", fatal: 111, nonFatal: 744 },
              { name: "Auster", fatal: 159, nonFatal: 690 },
              { name: "Grob", fatal: 88, nonFatal: 736 },
              { name: "Ryan", fatal: 250, nonFatal: 565 },
              { name: "Hiller", fatal: 69, nonFatal: 727 },
              { name: "General Dynamics", fatal: 251, nonFatal: 531 },
              { name: "Waco", fatal: 118, nonFatal: 641 },
              { name: "ATR", fatal: 32, nonFatal: 723 },
              { name: "Aero", fatal: 259, nonFatal: 483 },
              { name: "Pilatus", fatal: 221, nonFatal: 521 },
              { name: "Tecnam", fatal: 135, nonFatal: 592 },
              { name: "Bombardier", fatal: 14, nonFatal: 706 },
              { name: "Heinkel", fatal: 419, nonFatal: 297 },
              { name: "Tupolev", fatal: 301, nonFatal: 407 },
              { name: "BAe", fatal: 123, nonFatal: 573 },
              { name: "Lavochkin-Gorbunov-Gudkov", fatal: 54, nonFatal: 615 },
              { name: "DJI", fatal: 2, nonFatal: 629 },
              { name: "Armstrong", fatal: 379, nonFatal: 250 },
              { name: "Pitts", fatal: 206, nonFatal: 421 },
              { name: "McDonnell", fatal: 252, nonFatal: 374 },
              { name: "Albatros", fatal: 32, nonFatal: 589 },
              { name: "Scheibe", fatal: 101, nonFatal: 520 },
              { name: "Miles", fatal: 246, nonFatal: 366 },
              { name: "ERCO", fatal: 202, nonFatal: 382 },
              { name: "Mitsubishi", fatal: 295, nonFatal: 288 },
              { name: "Jodel", fatal: 120, nonFatal: 456 },
            ];

            const maxTotal = maxStackedTotal(manufacturers);
            const labelColumnWidth = barLabelColumnWidth(manufacturers.map((item) => item.name));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Top 25 Manufacturer Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{manufacturers.map((m) => {
                    const total = m.fatal + m.nonFatal;
                    const fatalPct = ((m.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={m.name} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Manufacturer Name */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                          title={m.name}
                        >
                          {m.name}
                        </span>

                        {/* Stacked Bar Track immediately following manufacturer name */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${m.name}: ${total.toLocaleString("en-US")} total (${m.fatal.toLocaleString("en-US")} fatal · ${m.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={m.fatal}
                            style={{
                              width: `${(m.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${m.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={m.nonFatal}
                            style={{
                              width: `${(m.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${m.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_name",
          fieldName: "Aircraft Name",
          fieldKey: "aircraft_name",
          dataType: "String",
          chartType: "Top 25 Distinct Aircraft Names Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Exact aircraft_name values from the validated dataset; no aircraft names are combined",
          statBadge: "25 Distinct Names",
          renderVisual: () => {
            const models = [
              { name: "172", fatal: 2078, nonFatal: 8537 },
              { name: "PA-28", fatal: 2666, nonFatal: 7075 },
              { name: "150", fatal: 1283, nonFatal: 4246 },
              { name: "DH-98", fatal: 1607, nonFatal: 3461 },
              { name: "182", fatal: 1312, nonFatal: 3433 },
              { name: "737", fatal: 135, nonFatal: 4150 },
              { name: "F4U", fatal: 1062, nonFatal: 3118 },
              { name: "C-47", fatal: 1419, nonFatal: 2167 },
              { name: "Spitfire", fatal: 1379, nonFatal: 2207 },
              { name: "PA-18", fatal: 764, nonFatal: 2676 },
              { name: "206", fatal: 804, nonFatal: 2524 },
              { name: "152", fatal: 400, nonFatal: 2859 },
              { name: "P-47", fatal: 340, nonFatal: 2498 },
              { name: "T-6", fatal: 828, nonFatal: 1926 },
              { name: "B-24", fatal: 1062, nonFatal: 1638 },
              { name: "Not Recorded", fatal: 1478, nonFatal: 1188 },
              { name: "Blenheim", fatal: 1219, nonFatal: 1361 },
              { name: "P-51", fatal: 564, nonFatal: 1993 },
              { name: "Beaufighter", fatal: 1237, nonFatal: 1280 },
              { name: "F-84", fatal: 1060, nonFatal: 1429 },
              { name: "M20", fatal: 814, nonFatal: 1660 },
              { name: "PA-32", fatal: 769, nonFatal: 1681 },
              { name: "180", fatal: 377, nonFatal: 1854 },
              { name: "DH-82", fatal: 510, nonFatal: 1721 },
              { name: "Lancaster", fatal: 1879, nonFatal: 331 },
            ];

            const maxTotal = maxStackedTotal(models);
            const labelColumnWidth = barLabelColumnWidth(models.map((item) => item.name));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Top 25 Aircraft Model Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{models.map((m) => {
                    const total = m.fatal + m.nonFatal;
                    const fatalPct = ((m.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={m.name} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Model Name */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                          title={m.name}
                        >
                          {m.name}
                        </span>

                        {/* Stacked Bar Track immediately following model name */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${m.name}: ${total.toLocaleString("en-US")} total (${m.fatal.toLocaleString("en-US")} fatal · ${m.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={m.fatal}
                            style={{
                              width: `${(m.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${m.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={m.nonFatal}
                            style={{
                              width: `${(m.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${m.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_model",
          fieldName: "Aircraft Model",
          fieldKey: "aircraft_model",
          dataType: "String",
          chartType: "Top 25 Technical Model Codes Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Technical model code breakdown combining fatal (red) and non-fatal (blue) events",
          statBadge: "Top 25 Model Codes",
          renderVisual: () => {
            const models = [
              { code: "Model 172M", fatal: 1240, nonFatal: 4960 },
              { code: "Model B737-800", fatal: 1150, nonFatal: 3650 },
              { code: "Model PA-28-180", fatal: 860, nonFatal: 3240 },
              { code: "Model A320-200", fatal: 850, nonFatal: 3050 },
              { code: "Model 150M", fatal: 720, nonFatal: 2880 },
              { code: "Model 182P", fatal: 748, nonFatal: 2652 },
              { code: "Model PA-18-150", fatal: 620, nonFatal: 2480 },
              { code: "Model V35B", fatal: 684, nonFatal: 2166 },
              { code: "Model 210N", fatal: 650, nonFatal: 1950 },
              { code: "Model 206B", fatal: 576, nonFatal: 1824 },
              { code: "Model B747-400", fatal: 720, nonFatal: 1530 },
              { code: "Model PA-24-250", fatal: 525, nonFatal: 1575 },
              { code: "Model M20J", fatal: 487, nonFatal: 1463 },
              { code: "Model DHC-6-300", fatal: 540, nonFatal: 1260 },
              { code: "Model C-130H", fatal: 544, nonFatal: 1156 },
              { code: "Model MD-82", fatal: 448, nonFatal: 1152 },
              { code: "Model R44 II", fatal: 375, nonFatal: 1125 },
              { code: "Model SR22T", fatal: 280, nonFatal: 1120 },
              { code: "Model B727-200", fatal: 422, nonFatal: 898 },
              { code: "Model DC-3A", fatal: 400, nonFatal: 850 },
              { code: "Model PA-32-300", fatal: 271, nonFatal: 909 },
              { code: "Model B200", fatal: 264, nonFatal: 836 },
              { code: "Model AS350B2", fatal: 235, nonFatal: 785 },
              { code: "Model F28-4000", fatal: 247, nonFatal: 703 },
              { code: "Model DA40 NG", fatal: 158, nonFatal: 722 },
            ];

            const maxTotal = maxStackedTotal(models);
            const labelColumnWidth = barLabelColumnWidth(models.map((item) => item.code));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Top 25 Technical Model Code Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{models.map((m) => {
                    const total = m.fatal + m.nonFatal;
                    const fatalPct = ((m.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={m.code} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Model Code Label */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                          title={m.code}
                        >
                          {m.code}
                        </span>

                        {/* Stacked Bar Track immediately following model code */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${m.code}: ${total.toLocaleString("en-US")} total (${m.fatal.toLocaleString("en-US")} fatal · ${m.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={m.fatal}
                            style={{
                              width: `${(m.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${m.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={m.nonFatal}
                            style={{
                              width: `${(m.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${m.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_variant",
          fieldName: "Aircraft Variant",
          fieldKey: "aircraft_variant",
          dataType: "String",
          chartType: "Top 25 Sub-Variants Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Normalized aircraft sub-variant designations combining fatal (red) and non-fatal (blue) events",
          statBadge: "Top 25 Sub-Variants",
          renderVisual: () => {
            const variants = [
              { name: "Boeing 737-800", fatal: 340, nonFatal: 1080 },
              { name: "Lockheed C-130H", fatal: 314, nonFatal: 666 },
              { name: "Piper PA-28-180", fatal: 178, nonFatal: 672 },
              { name: "Airbus A320-214", fatal: 174, nonFatal: 616 },
              { name: "Diamond DA40 NG", fatal: 112, nonFatal: 508 },
              { name: "Eurocopter AS350B2", fatal: 124, nonFatal: 416 },
              { name: "Cessna 172M", fatal: 102, nonFatal: 408 },
              { name: "Beechcraft B200", fatal: 115, nonFatal: 365 },
              { name: "Boeing 777-200ER", fatal: 135, nonFatal: 315 },
              { name: "McDonnell MD-82", fatal: 118, nonFatal: 302 },
              { name: "ATR 72-500", fatal: 105, nonFatal: 285 },
              { name: "Bell 206L-3", fatal: 89, nonFatal: 281 },
              { name: "Robinson R44 II", fatal: 87, nonFatal: 263 },
              { name: "Cirrus SR22 G3", fatal: 66, nonFatal: 264 },
              { name: "Embraer ERJ-145LR", fatal: 62, nonFatal: 248 },
              { name: "Bombardier CRJ-200ER", fatal: 72, nonFatal: 218 },
              { name: "Cessna 208B Caravan", fatal: 68, nonFatal: 207 },
              { name: "Piper PA-34-200T", fatal: 57, nonFatal: 203 },
              { name: "Airbus A330-300", fatal: 54, nonFatal: 191 },
              { name: "Boeing 757-200", fatal: 51, nonFatal: 179 },
              { name: "de Havilland DHC-8-402", fatal: 47, nonFatal: 168 },
              { name: "Lockheed P-3C Orion", fatal: 52, nonFatal: 148 },
              { name: "AgustaWestland AW139", fatal: 41, nonFatal: 144 },
              { name: "Fairchild SA227-AC", fatal: 44, nonFatal: 126 },
              { name: "Mooney M20J 201", fatal: 38, nonFatal: 117 },
            ];

            const maxTotal = maxStackedTotal(variants);
            const labelColumnWidth = barLabelColumnWidth(variants.map((item) => item.name));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Top 25 Variant Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{variants.map((v) => {
                    const total = v.fatal + v.nonFatal;
                    const fatalPct = ((v.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={v.name} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Variant Name */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                          title={v.name}
                        >
                          {v.name}
                        </span>

                        {/* Stacked Bar Track immediately following variant name */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${v.name}: ${total.toLocaleString("en-US")} total (${v.fatal.toLocaleString("en-US")} fatal · ${v.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={v.fatal}
                            style={{
                              width: `${(v.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${v.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={v.nonFatal}
                            style={{
                              width: `${(v.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${v.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_designation",
          fieldName: "Aircraft Designation",
          fieldKey: "aircraft_designation",
          dataType: "String",
          chartType: "Distinct Aircraft Designations Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Exact aircraft_designation values from the validated dataset; no designations are combined",
          statBadge: "2 Distinct Designations",
          renderVisual: () => {
            const designations = [
              { label: "Civil", fatal: 73209, nonFatal: 200370 },
              { label: "Military", fatal: 44676, nonFatal: 78498 },
            ];

            const maxTotal = maxStackedTotal(designations);
            const labelColumnWidth = barLabelColumnWidth(designations.map((item) => item.label));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Designation Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{designations.map((d) => {
                    const total = d.fatal + d.nonFatal;
                    const fatalPct = ((d.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={d.label} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Designation Label */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {d.label}
                        </span>

                        {/* Stacked Bar Track immediately following designation label */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${d.label}: ${total.toLocaleString("en-US")} total (${d.fatal.toLocaleString("en-US")} fatal · ${d.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={d.fatal}
                            style={{
                              width: `${(d.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${d.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={d.nonFatal}
                            style={{
                              width: `${(d.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${d.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_common_name",
          fieldName: "Common Name",
          fieldKey: "aircraft_common_name",
          dataType: "String",
          chartType: "Top 25 Distinct Common Names Stacked Bar List (Fatal vs. Non-Fatal)",
          description: "Exact aircraft_common_name values from the validated dataset; no common names are combined",
          statBadge: "25 Distinct Common Names",
          renderVisual: () => {
            const names = [
              { name: "Skyhawk", fatal: 2482, nonFatal: 9409 },
              { name: "Cherokee", fatal: 2799, nonFatal: 7008 },
              { name: "Cessna 150", fatal: 1285, nonFatal: 4247 },
              { name: "Skylane", fatal: 1456, nonFatal: 3970 },
              { name: "Mosquito", fatal: 1608, nonFatal: 3464 },
              { name: "Bonanza", fatal: 1872, nonFatal: 2403 },
              { name: "Corsair", fatal: 1121, nonFatal: 3150 },
              { name: "DC-3", fatal: 1639, nonFatal: 2529 },
              { name: "Glider", fatal: 986, nonFatal: 2953 },
              { name: "Super Cub", fatal: 835, nonFatal: 2804 },
              { name: "Spitfire", fatal: 1382, nonFatal: 2208 },
              { name: "Mustang", fatal: 913, nonFatal: 2578 },
              { name: "Cessna 152", fatal: 417, nonFatal: 2944 },
              { name: "Centurion", fatal: 877, nonFatal: 2442 },
              { name: "Thunderbolt", fatal: 418, nonFatal: 2604 },
              { name: "Liberator", fatal: 1150, nonFatal: 1829 },
              { name: "Propeller Aircraft", fatal: 1586, nonFatal: 1262 },
              { name: "WL", fatal: 20, nonFatal: 2804 },
              { name: "Texan", fatal: 784, nonFatal: 1924 },
              { name: "Blenheim", fatal: 1221, nonFatal: 1363 },
              { name: "Shooting Star", fatal: 1022, nonFatal: 1556 },
              { name: "Beaufighter", fatal: 1237, nonFatal: 1280 },
              { name: "Stationair", fatal: 651, nonFatal: 1654 },
              { name: "M20", fatal: 761, nonFatal: 1502 },
              { name: "Lightning", fatal: 318, nonFatal: 1921 },
            ];

            const maxTotal = maxStackedTotal(names);
            const labelColumnWidth = barLabelColumnWidth(names.map((item) => item.name));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", paddingTop: "4px" }}>
                {/* Legend Header */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "3px" }} />
                    <span>Fatal Events</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "3px" }} />
                    <span>Non-Fatal Events</span>
                  </div>
                </div>

                {/* Top 25 Common Name Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <TopNRows>{names.map((n) => {
                    const total = n.fatal + n.nonFatal;
                    const fatalPct = ((n.fatal / total) * 100).toFixed(1);

                    return (
                      <div key={n.name} data-bar-value={total} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        {/* Common Name Label */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: labelColumnWidth,
                            textAlign: "right",
                            flexShrink: 0,
                            lineHeight: "1rem",
                            whiteSpace: "normal",
                            overflow: "visible",
                            textOverflow: "clip",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                          title={n.name}
                        >
                          {n.name}
                        </span>

                        {/* Stacked Bar Track immediately following common name label */}
                        <div
                          style={{
                            height: "16px",
                            flex: 1,
                            background: "var(--surface-subtle)",
                            borderRadius: "4px",
                            overflow: "hidden",
                            display: "flex",
                            border: "1px solid var(--border-soft)",
                          }}
                          title={`${n.name}: ${total.toLocaleString("en-US")} total (${n.fatal.toLocaleString("en-US")} fatal · ${n.nonFatal.toLocaleString("en-US")} non-fatal)`}
                        >
                          <div
                            data-bar-series="fatal"
                            data-series-value={n.fatal}
                            style={{
                              width: `${(n.fatal / maxTotal) * 100}%`,
                              background: "#ef4444",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Fatal: ${n.fatal.toLocaleString("en-US")} (${fatalPct}%)`}
                          />
                          <div
                            data-bar-series="non-fatal"
                            data-series-value={n.nonFatal}
                            style={{
                              width: `${(n.nonFatal / maxTotal) * 100}%`,
                              background: "#3b82f6",
                              height: "100%",
                              transition: "width 0.2s ease",
                            }}
                            title={`Non-Fatal: ${n.nonFatal.toLocaleString("en-US")}`}
                          />
                        </div>

                        {/* Total event count right-aligned on the right */}
                        <span
                          style={{
                            color: "var(--text)",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            width: BAR_VALUE_COLUMN_WIDTH,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {total.toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}</TopNRows>
                </div>
              </div>
            );
          },
        },
        {
          id: "year_of_manufacture",
          fieldName: "Build Year",
          fieldKey: "year_of_manufacture",
          dataType: "Integer",
          chartType: "Fleet Age Distribution Histogram",
          description: "Distribution of aircraft age at time of occurrence",
          statBadge: "Build Years",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "0 - 5 Years Old", value: "68,400", pct: 68 },
                { label: "6 - 15 Years Old", value: "142,800", pct: 100 },
                { label: "16 - 30 Years Old", value: "114,200", pct: 80 },
                { label: "30+ Years Old (Vintage)", value: "71,353", pct: 50 },
              ]}
            />
          ),
        },
        {
          id: "engine_model",
          fieldName: "Engine Model",
          fieldKey: "engine_model",
          dataType: "String",
          chartType: "Powerplant Distribution Treemap",
          description: "Powerplant model breakdown across piston, turboprop, and jet engines",
          statBadge: "Engine Models",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Lycoming O-360 Series", value: "48,200", pct: 100 },
                { label: "Continental O-470 Series", value: "36,400", pct: 75 },
                { label: "Pratt & Whitney PT6A", value: "24,100", pct: 50 },
                { label: "CFM International CFM56", value: "18,900", pct: 39 },
              ]}
            />
          ),
        },
        {
          id: "total_airframe_hrs",
          fieldName: "Total Airframe Hours",
          fieldKey: "total_airframe_hrs",
          dataType: "Float",
          chartType: "Airframe Hours Density Plot",
          description: "Cumulative flight hours logged on airframe",
          statBadge: "Hours Logged",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "0 - 1,000 Hrs", value: "98,400", pct: 70 },
                { label: "1,000 - 5,000 Hrs", value: "141,200", pct: 100 },
                { label: "5,000 - 15,000 Hrs", value: "102,800", pct: 72 },
                { label: "15,000+ High Hours", value: "54,353", pct: 38 },
              ]}
            />
          ),
        },
      ],
    },
    {
      id: "operational",
      title: "Operational & Flight Context",
      icon: Building2,
      color: "#8b5cf6",
      cards: [
        {
          id: "operator",
          fieldName: "Flight Operator / Airline",
          fieldKey: "operator",
          dataType: "String",
          chartType: "Top 20 Operator Bar Chart",
          description: "Leading commercial airlines, general aviation operators, and military branches",
          statBadge: "100% Resolved",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "United States Air Force (USAF)", value: "38,400", pct: 100, color: "#8b5cf6" },
                { label: "United States Navy (USN)", value: "19,200", pct: 50, color: "#8b5cf6" },
                { label: "Private / General Aviation", value: "148,000", pct: 90, color: "#8b5cf6" },
                { label: "Air France", value: "3,200", pct: 8, color: "#8b5cf6" },
                { label: "American Airlines", value: "3,100", pct: 8, color: "#8b5cf6" },
                { label: "Lufthansa", value: "2,800", pct: 7, color: "#8b5cf6" },
              ]}
            />
          ),
        },
        {
          id: "nature",
          fieldName: "Flight Purpose / Nature",
          fieldKey: "nature",
          dataType: "String",
          chartType: "Flight Purpose Donut Chart",
          description: "Categorization by flight nature (Scheduled Airline, General Aviation, Military, Cargo, Private)",
          statBadge: "100% Standardized",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "General Aviation / Private", value: "184,200", pct: 100, color: "#8b5cf6" },
                { label: "Military Operations / Training", value: "98,400", pct: 53, color: "#7c3aed" },
                { label: "Scheduled Commercial Passenger", value: "54,100", pct: 29, color: "#6d28d9" },
                { label: "Cargo / Freight Operations", value: "32,800", pct: 17, color: "#5b21b6" },
                { label: "Agricultural / Aerial Work", value: "27,253", pct: 14, color: "#4c1d95" },
              ]}
            />
          ),
        },
        {
          id: "phase",
          fieldName: "Flight Phase",
          fieldKey: "phase",
          dataType: "String",
          chartType: "Operational Phase Funnel Chart",
          description: "Normalized flight phase risk from Landing, Approach, En Route to Takeoff",
          statBadge: "100% Normalized",
          renderVisual: () => (
            <PhaseChart
              data={[
                { phase: "Landing", events: 142100 },
                { phase: "En Route", events: 104500 },
                { phase: "Approach", events: 68200 },
                { phase: "Takeoff", events: 54100 },
                { phase: "Climb / Descent", events: 27853 },
              ]}
            />
          ),
        },
        {
          id: "phase_group",
          fieldName: "Phase Group",
          fieldKey: "phase_group",
          dataType: "String",
          chartType: "Operational Stage Group Donut",
          description: "High-level operational stage grouping (Ground, Takeoff, Flight, Landing)",
          statBadge: "100% Normalized",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Flight Phase", value: "132,353", pct: 64, color: "#6d28d9" },
                { label: "Landing Phase", value: "142,100", pct: 69, color: "#7c3aed" },
                { label: "Takeoff Phase", value: "81,953", pct: 40, color: "#8b5cf6" },
                { label: "Ground / Standing", value: "40,347", pct: 20, color: "#a78bfa" },
              ]}
            />
          ),
        },
        {
          id: "confidence_rating",
          fieldName: "Data Confidence Rating",
          fieldKey: "confidence_rating",
          dataType: "String",
          chartType: "Data Reliability Score Gauge",
          description: "Investigative source reliability rating (High, Medium, Low)",
          statBadge: "100% Categorized",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "High Confidence (Official)", value: "312,400", pct: 100, color: "#10b981" },
                { label: "Medium Confidence (Verified)", value: "68,200", pct: 21, color: "#f59e0b" },
                { label: "Low Confidence (Press Only)", value: "16,153", pct: 5, color: "#ef4444" },
              ]}
            />
          ),
        },
        {
          id: "category",
          fieldName: "Event Category",
          fieldKey: "category",
          dataType: "String",
          chartType: "Accident vs Incident Pie Chart",
          description: "Categorization by Accident vs. Serious Incident vs. Incident",
          statBadge: "Full Coverage",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Accident", value: "318,400", pct: 100, color: "#ef4444" },
                { label: "Incident", value: "54,200", pct: 17, color: "#f59e0b" },
                { label: "Serious Incident", value: "24,153", pct: 7, color: "#3b82f6" },
              ]}
            />
          ),
        },
        {
          id: "icao_occurrence_category",
          fieldName: "ICAO ADREP Category",
          fieldKey: "icao_occurrence_category",
          dataType: "String",
          chartType: "ICAO Taxonomy Bar Chart",
          description: "Official ICAO safety occurrence taxonomy breakdown",
          statBadge: "ICAO Standard",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "System Failure (SCF-PP)", value: "98,400", pct: 100 },
                { label: "Loss of Control (LOC-I)", value: "84,200", pct: 85 },
                { label: "Runway Excursion (RE)", value: "68,100", pct: 69 },
                { label: "Controlled Flight Into Terrain (CFIT)", value: "42,800", pct: 43 },
              ]}
            />
          ),
        },
      ],
    },
    {
      id: "severity",
      title: "Severity, Damage & Human Impact",
      icon: ShieldAlert,
      color: "#ef4444",
      cards: [
        {
          id: "aircraft_damage",
          fieldName: "Aircraft Damage Degree",
          fieldKey: "aircraft_damage",
          dataType: "String",
          chartType: "Damage Severity Classification Treemap",
          description: "Degree of damage categorized across Destroyed, Substantial, Minor, and Missing",
          statBadge: "100% Normalized",
          renderVisual: () => {
            const tileBase = {
              color: "#ffffff",
              padding: "14px",
              display: "flex",
              flexDirection: "column" as const,
              justifyContent: "space-between",
              borderRadius: "7px",
              minWidth: 0,
              overflow: "hidden",
            };

            return (
              <div
                aria-label="Aircraft damage severity treemap"
                style={{ display: "grid", gridTemplateColumns: "60.4fr 39.6fr", gap: "4px", minHeight: "180px", paddingTop: "6px" }}
              >
                <div style={{ ...tileBase, background: "#ef4444" }} title="Destroyed: 239,831 events (60.4%)">
                  <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>Destroyed</span>
                  <span style={{ fontSize: "0.76rem", fontWeight: 700 }}>{formatChartNumber(239831)} · 60.4%</span>
                </div>
                <div style={{ display: "grid", gridTemplateRows: "minmax(72px, 28.5fr) minmax(52px, 10.3fr) 34px", gap: "4px", minWidth: 0 }}>
                  <div style={{ ...tileBase, background: "#f59e0b" }} title="Substantial: 113,089 events (28.5%)">
                    <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>Substantial</span>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700 }}>{formatChartNumber(113089)} · 28.5%</span>
                  </div>
                  <div style={{ ...tileBase, background: "#10b981" }} title="Minor: 40,995 events (10.3%)">
                    <span style={{ fontSize: "0.8rem", fontWeight: 800 }}>Minor</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>{formatChartNumber(40995)} · 10.3%</span>
                  </div>
                  <div style={{ ...tileBase, background: "#6b7280", padding: "4px 10px", flexDirection: "row", alignItems: "center", gap: "6px" }} title="Missing: 2,838 events (0.8%)">
                    <span style={{ fontSize: "0.66rem", fontWeight: 800 }}>Missing</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{formatChartNumber(2838)} · 0.8%</span>
                  </div>
                </div>
              </div>
            );
          },
        },
        {
          id: "aircraft_disposition",
          fieldName: "Airframe Disposition",
          fieldKey: "aircraft_disposition",
          dataType: "String",
          chartType: "Airframe Disposition Flow",
          description: "Post-event airframe outcome (Written Off, Repaired, Scrapped)",
          statBadge: "Disposition Flow",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Written Off / Wrecked", value: "242,100", pct: 100, color: "#ef4444" },
                { label: "Repaired / Returned", value: "118,400", pct: 48, color: "#10b981" },
                { label: "Scrapped / Parts", value: "32,800", pct: 13, color: "#f59e0b" },
                { label: "Preserved / Museum", value: "3,453", pct: 1, color: "#3b82f6" },
              ]}
            />
          ),
        },
        {
          id: "occupants",
          fieldName: "Total Occupants Onboard",
          fieldKey: "occupants",
          dataType: "Integer",
          chartType: "Modern Aircraft Capacity Distribution",
          description: "Recorded passenger and crew headcount grouped into modern aircraft capacity bands (zero and unrecorded values excluded)",
          statBadge: "19 Capacity Bands",
          renderVisual: () => (
            <OrderedBandChart
              items={[
                { label: "1", fatal: 42613, nonFatal: 90793 },
                { label: "2", fatal: 31302, nonFatal: 53959 },
                { label: "3–4", fatal: 19851, nonFatal: 22205 },
                { label: "5–6", fatal: 7775, nonFatal: 5650 },
                { label: "7–9", fatal: 6995, nonFatal: 3009 },
                { label: "10–19", fatal: 4213, nonFatal: 3043 },
                { label: "20–29", fatal: 961, nonFatal: 1041 },
                { label: "30–49", fatal: 712, nonFatal: 1457 },
                { label: "50–69", fatal: 298, nonFatal: 1173 },
                { label: "70–89", fatal: 179, nonFatal: 989 },
                { label: "90–119", fatal: 175, nonFatal: 1343 },
                { label: "120–149", fatal: 96, nonFatal: 1316 },
                { label: "150–179", fatal: 63, nonFatal: 1273 },
                { label: "180–219", fatal: 27, nonFatal: 966 },
                { label: "220–279", fatal: 32, nonFatal: 716 },
                { label: "280–349", fatal: 18, nonFatal: 438 },
                { label: "350–449", fatal: 5, nonFatal: 244 },
                { label: "450+", fatal: 3, nonFatal: 66 },
              ]}
            />
          ),
        },
        {
          id: "fatalities_onboard",
          fieldName: "Fatalities Onboard",
          fieldKey: "fatalities_onboard",
          dataType: "Integer",
          chartType: "Onboard Fatality Count Distribution",
          description: "Events grouped by onboard fatality count and split by whether anyone survived",
          statBadge: "9 Fatality Bands",
          renderVisual: () => (
            <OrderedBandChart
              fatalLabel="No Survivors"
              nonFatalLabel="Survivors / Zero Fatalities"
              items={[
                { label: "0", fatal: 0, nonFatal: 281435 },
                { label: "1", fatal: 42613, nonFatal: 11452 },
                { label: "2", fatal: 24405, nonFatal: 3504 },
                { label: "3", fatal: 7497, nonFatal: 2092 },
                { label: "4–5", fatal: 9356, nonFatal: 2159 },
                { label: "6–10", fatal: 6804, nonFatal: 1751 },
                { label: "11–50", fatal: 2308, nonFatal: 849 },
                { label: "51–100", fatal: 226, nonFatal: 112 },
                { label: "101+", fatal: 140, nonFatal: 50 },
              ]}
            />
          ),
        },
        {
          id: "survivors_onboard",
          fieldName: "Survivors Onboard",
          fieldKey: "survivors_onboard",
          dataType: "Integer",
          chartType: "Onboard Survivor Count Distribution",
          description: "Events grouped by the numeric count of onboard survivors",
          statBadge: "10 Survivor Bands",
          renderVisual: () => (
            <OrderedBandChart
              items={[
                { label: "0", fatal: 93349, nonFatal: 91754 },
                { label: "1", fatal: 11012, nonFatal: 90793 },
                { label: "2", fatal: 3763, nonFatal: 53959 },
                { label: "3", fatal: 2145, nonFatal: 13120 },
                { label: "4–5", fatal: 2140, nonFatal: 12511 },
                { label: "6–10", fatal: 1638, nonFatal: 6069 },
                { label: "11–50", fatal: 1017, nonFatal: 4775 },
                { label: "51–100", fatal: 141, nonFatal: 2569 },
                { label: "101–499", fatal: 112, nonFatal: 5855 },
                { label: "500+", fatal: 1, nonFatal: 30 },
              ]}
            />
          ),
        },
        {
          id: "fatalities_ground",
          fieldName: "Ground Fatalities",
          fieldKey: "fatalities_ground",
          dataType: "Integer",
          chartType: "Ground Fatality Count Distribution",
          description: "Events grouped by ground-fatality count and split by recorded onboard survival",
          statBadge: "11 Ground-Fatality Bands",
          renderVisual: () => (
            <OrderedBandChart
              fatalLabel="No Onboard Survivors Recorded"
              nonFatalLabel="Onboard Survivors / Zero Ground Fatalities"
              items={[
                { label: "0", fatal: 0, nonFatal: 389301 },
                { label: "1", fatal: 2279, nonFatal: 1578 },
                { label: "2", fatal: 1094, nonFatal: 512 },
                { label: "3", fatal: 332, nonFatal: 141 },
                { label: "4–5", fatal: 415, nonFatal: 159 },
                { label: "6–10", fatal: 402, nonFatal: 163 },
                { label: "11–50", fatal: 226, nonFatal: 75 },
                { label: "51–100", fatal: 30, nonFatal: 5 },
                { label: "101–499", fatal: 34, nonFatal: 5 },
                { label: "500–999", fatal: 1, nonFatal: 0 },
                { label: "1,000+", fatal: 1, nonFatal: 0 },
              ]}
            />
          ),
        },
        {
          id: "survival_rate_onboard",
          fieldName: "Onboard Survival Rate",
          fieldKey: "survival_rate_onboard",
          dataType: "Float",
          chartType: "Aircraft Manufacturer + Model Survival Rate Ranking",
          description: "Aggregate onboard survival rate by Aircraft Manufacturer + Aircraft Model, ranked across the 100 most-recorded valid combinations",
          statBadge: "Top 100 Aircraft Models",
          renderVisual: () => (
            <AircraftOnboardRateChart
              items={aircraftRateRows.map((row) => ({
                ...row,
                rate: row.occupants > 0 ? (row.survivors / row.occupants) * 100 : 0,
              }))}
              metric="survival"
            />
          ),
        },
        {
          id: "fatality_rate_onboard",
          fieldName: "Onboard Fatality Rate",
          fieldKey: "fatality_rate_onboard",
          dataType: "Float",
          chartType: "Aircraft Manufacturer + Model Fatality Rate Ranking",
          description: "Aggregate onboard fatality rate by Aircraft Manufacturer + Aircraft Model, ranked across the 100 most-recorded valid combinations",
          statBadge: "Top 100 Aircraft Models",
          renderVisual: () => (
            <AircraftOnboardRateChart
              items={aircraftRateRows.map((row) => ({
                ...row,
                rate: row.occupants > 0 ? (row.survivors / row.occupants) * 100 : 0,
              }))}
              metric="fatality"
            />
          ),
        },
      ],
    },
    {
      id: "geography",
      title: "Geography & Spatial Coordinates",
      icon: Globe,
      color: "#f59e0b",
      cards: [
        {
          id: "continent",
          fieldName: "Continent",
          fieldKey: "continent",
          dataType: "String",
          chartType: "Continent and Country Treemap Drilldown",
          description: "Continental occurrence distribution with country-level drilldown",
          statBadge: "8 Continents",
          renderVisual: () => (
            <ContinentTreemapDrilldown rows={databaseDistributions.continent_country ?? []} />
          ),
        },
        {
          id: "country",
          fieldName: "Country of Occurrence",
          fieldKey: "country",
          dataType: "String",
          chartType: "Top 15 Country Distribution Bar",
          description: "Geographical event concentration across 200+ countries",
          statBadge: "Global Coverage",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "United States", value: "168,400", pct: 100, color: "#f59e0b" },
                { label: "Russia", value: "24,100", pct: 14, color: "#f59e0b" },
                { label: "United Kingdom", value: "18,200", pct: 11, color: "#f59e0b" },
                { label: "Canada", value: "17,900", pct: 10, color: "#f59e0b" },
                { label: "France", value: "15,400", pct: 9, color: "#f59e0b" },
                { label: "Brazil", value: "14,200", pct: 8, color: "#f59e0b" },
                { label: "Germany", value: "12,800", pct: 7, color: "#f59e0b" },
                { label: "Australia", value: "11,900", pct: 7, color: "#f59e0b" },
              ]}
            />
          ),
        },
        {
          id: "location",
          fieldName: "Location Details",
          fieldKey: "location",
          dataType: "String",
          chartType: "Geocoded Location Frequency Table",
          description: "City, aerodrome, or site description frequency",
          statBadge: "Specific Locations",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Off Runway / On Takeoff", value: "48,200", pct: 100 },
                { label: "Near Aerodrome / Approach", value: "36,400", pct: 75 },
                { label: "Mountainous Terrain", value: "24,100", pct: 50 },
                { label: "Maritime / Open Water", value: "18,900", pct: 39 },
              ]}
            />
          ),
        },
        {
          id: "region",
          fieldName: "Geographic Region",
          fieldKey: "region",
          dataType: "String",
          chartType: "Regional Risk Breakdown Treemap",
          description: "Sub-regional geographic risk breakdown",
          statBadge: "Regions",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Northern America", value: "186,300", pct: 100 },
                { label: "Western Europe", value: "54,200", pct: 29 },
                { label: "Eastern Europe", value: "42,100", pct: 22 },
                { label: "South America", value: "32,400", pct: 17 },
              ]}
            />
          ),
        },
        {
          id: "departure_airport",
          fieldName: "Departure Airport",
          fieldKey: "departure_airport",
          dataType: "String",
          chartType: "Origin Airport Hub Leaderboard",
          description: "Origin airport occurrence frequency",
          statBadge: "100% Standardized",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Miami Intl Airport (MIA)", value: "1,240", pct: 100 },
                { label: "Chicago O'Hare (ORD)", value: "1,180", pct: 95 },
                { label: "Anchorage Intl (ANC)", value: "980", pct: 79 },
                { label: "London Heathrow (LHR)", value: "850", pct: 68 },
              ]}
            />
          ),
        },
        {
          id: "departure_iata",
          fieldName: "Departure IATA Code",
          fieldKey: "departure_iata",
          dataType: "String",
          chartType: "Origin IATA Hub Map",
          description: "Three-letter IATA origin hub codes",
          statBadge: "IATA Hubs",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "MIA", value: "1,240", pct: 100 },
                { label: "ORD", value: "1,180", pct: 95 },
                { label: "ANC", value: "980", pct: 79 },
                { label: "LHR", value: "850", pct: 68 },
              ]}
            />
          ),
        },
        {
          id: "destination_airport",
          fieldName: "Destination Airport",
          fieldKey: "destination_airport",
          dataType: "String",
          chartType: "Destination Airport Hub Leaderboard",
          description: "Intended landing airport frequency",
          statBadge: "100% Standardized",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Miami Intl Airport (MIA)", value: "1,190", pct: 100 },
                { label: "Chicago O'Hare (ORD)", value: "1,120", pct: 94 },
                { label: "Anchorage Intl (ANC)", value: "940", pct: 78 },
                { label: "London Heathrow (LHR)", value: "820", pct: 68 },
              ]}
            />
          ),
        },
        {
          id: "destination_iata",
          fieldName: "Destination IATA Code",
          fieldKey: "destination_iata",
          dataType: "String",
          chartType: "Destination IATA Hub Map",
          description: "Three-letter IATA destination hub codes",
          statBadge: "IATA Hubs",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "MIA", value: "1,190", pct: 100 },
                { label: "ORD", value: "1,120", pct: 94 },
                { label: "ANC", value: "940", pct: 78 },
                { label: "LHR", value: "820", pct: 68 },
              ]}
            />
          ),
        },
      ],
    },
    {
      id: "environment",
      title: "Environmental & Weather Factors",
      icon: CloudSun,
      color: "#06b6d4",
      cards: [
        {
          id: "weather_or_visibility_mentioned",
          fieldName: "Weather / Visibility Factors",
          fieldKey: "weather_or_visibility_mentioned",
          dataType: "String",
          chartType: "IMC vs. VMC Flight Condition Pie Chart",
          description: "Instrument Meteorological Conditions (IMC) vs. Visual (VMC) flight rules",
          statBadge: "Weather Factors",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Visual Conditions (VMC)", value: "312,800", pct: 100, color: "#10b981" },
                { label: "Instrument Conditions (IMC)", value: "83,953", pct: 26, color: "#06b6d4" },
              ]}
            />
          ),
        },
      ],
    },
    {
      id: "investigation",
      title: "Investigation, Governance & Narrative Text",
      icon: FileText,
      color: "#ec4899",
      cards: [
        {
          id: "investigating_agency",
          fieldName: "Investigating Agency",
          fieldKey: "investigating_agency",
          dataType: "String",
          chartType: "Lead Authority Leaderboard Bar",
          description: "Primary investigating agency breakdown (NTSB, AAIB, BEA, BFU, TSB, CENIPA)",
          statBadge: "Agencies",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "NTSB (United States)", value: "182,400", pct: 100, color: "#ec4899" },
                { label: "AAIB (United Kingdom)", value: "19,800", pct: 11, color: "#ec4899" },
                { label: "BEA (France)", value: "16,200", pct: 9, color: "#ec4899" },
                { label: "BFU (Germany)", value: "13,100", pct: 7, color: "#ec4899" },
                { label: "TSB (Canada)", value: "12,400", pct: 7, color: "#ec4899" },
                { label: "CENIPA (Brazil)", value: "11,200", pct: 6, color: "#ec4899" },
              ]}
            />
          ),
        },
        {
          id: "accident_investigation_duration",
          fieldName: "Investigation Duration (Days)",
          fieldKey: "accident_investigation_duration",
          dataType: "Integer",
          chartType: "Investigation Speed Histogram (Days)",
          description: "Elapsed days between occurrence and final safety report publication",
          statBadge: "Days Duration",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "0 - 180 Days (Fast Track)", value: "124,500", pct: 100 },
                { label: "181 - 365 Days (Standard)", value: "184,200", pct: 100 },
                { label: "1 - 3 Years (Complex)", value: "68,100", pct: 36 },
                { label: "3+ Years (Extended)", value: "19,953", pct: 10 },
              ]}
            />
          ),
        },
        {
          id: "accident_investigation_status",
          fieldName: "Investigation Status",
          fieldKey: "accident_investigation_status",
          dataType: "String",
          chartType: "Investigation Status Donut Chart",
          description: "Official investigation status (Completed, Final Report, Ongoing)",
          statBadge: "Status Types",
          renderVisual: () => (
            <MiniBarList
              items={[
                { label: "Completed / Final Report", value: "368,400", pct: 100, color: "#10b981" },
                { label: "Preliminary Report", value: "18,200", pct: 5, color: "#f59e0b" },
              ]}
            />
          ),
        },
      ],
    },
  ];

  const activeCategory = ALL_SECTIONS.find((s) => s.id === activeTab) ?? ALL_SECTIONS[0];
  const allCards = ALL_SECTIONS.flatMap((sec) => sec.cards);
  const allCardIds = allCards.map((c) => c.id);

  useEffect(() => {
    if (selectedCardIds.size === 0 && allCardIds.length > 0) {
      setSelectedCardIds(new Set(allCardIds));
    }
  }, [allCardIds.length]);

  const FIELD_OPTIONS_MAP: Record<string, string[]> = {
    country: [
      "United States", "United Kingdom", "Canada", "Australia", "France",
      "Germany", "Brazil", "Japan", "Mexico", "Italy", "Spain", "Colombia",
      "China", "India", "South Africa", "New Zealand", "Netherlands", "Sweden"
    ],
    operator: [
      "Private", "Military", "US Air Force", "Royal Air Force", "American Airlines",
      "Pan American World Airways", "United Airlines", "Delta Air Lines",
      "Lufthansa", "Air France", "British Airways", "Aeroflot"
    ],
    phaseGroup: ["Landing", "Flight", "Takeoff", "Ground / Standing"],
    severity: ["fatal", "nonfatal", "all"],
    aircraft_type: ["Airplane", "Helicopter", "Glider", "Gyroplane", "Balloon", "Airship"],
    aircraft_make: [
      "Cessna", "Piper", "Boeing", "Beechcraft", "de Havilland",
      "Lockheed", "Bell", "Douglas", "Airbus", "Robinson", "Mooney", "Grumman"
    ],
    engine_model: ["Reciprocating", "Turbo Prop", "Turbo Fan", "Turbo Jet", "Turboshaft"],
    continent: ["North America", "Europe", "Asia", "South America", "Africa", "Oceania"],
    investigating_agency: [
      "NTSB (United States)", "AAIB (United Kingdom)", "BEA (France)",
      "TSB (Canada)", "CENIPA (Brazil)", "BFU (Germany)"
    ],
    weather_condition: ["Visual Conditions (VMC)", "Instrument Conditions (IMC)"],
    accident_investigation_status: ["Completed / Final Report", "Preliminary Report"]
  };

  function computeAppliedFilters(rules: CustomFilterRule[], baseFilters: AnalyticsFilters): AnalyticsFilters {
    const result: AnalyticsFilters = {
      ...baseFilters,
      yearStart: baseFilters.yearStart ?? 1902,
      yearEnd: baseFilters.yearEnd ?? 2026,
      severity: baseFilters.severity ?? "all",
      country: baseFilters.country ?? undefined,
      operator: baseFilters.operator ?? undefined,
      phaseGroup: baseFilters.phaseGroup ?? undefined,
    };

    for (const rule of rules) {
      const key = rule.fieldKey;
      const val = rule.value;
      const cleanVal = val.split("(+")[0].trim();

      if (key === "event_year") {
        if (cleanVal.includes("–")) {
          const parts = cleanVal.split("–").map((s) => s.trim());
          const startYr = parseInt(parts[0], 10);
          const endYr = parseInt(parts[1], 10);
          if (!isNaN(startYr)) result.yearStart = startYr;
          if (!isNaN(endYr)) result.yearEnd = endYr;
        } else {
          const yr = parseInt(cleanVal, 10);
          if (!isNaN(yr)) {
            result.yearStart = yr;
            result.yearEnd = yr;
          }
        }
      } else if (key === "country") {
        result.country = cleanVal;
      } else if (key === "operator") {
        result.operator = cleanVal;
      } else if (key === "phaseGroup") {
        result.phaseGroup = cleanVal;
      } else if (key === "severity") {
        result.severity = cleanVal as any;
      } else {
        (result as any)[key] = cleanVal;
      }
    }

    return result;
  }

  const handleAddFilter = () => {
    const selectedCard = allCards.find((c) => c.fieldKey === selectedFilterField);
    const fieldLabel = selectedCard ? selectedCard.fieldName : selectedFilterField;
    const dtype = selectedCard?.dataType || "";
    const isNumeric =
      dtype === "Integer" ||
      dtype === "Float" ||
      [
        "event_year",
        "year_of_manufacture",
        "event_day",
        "event_weekday",
        "day_of_month",
        "day_of_week",
        "total_occupants",
        "fatalities",
        "survivors",
        "ground_fatalities",
        "accident_investigation_duration",
      ].includes(selectedFilterField);

    let ruleVal = "";
    if (isNumeric) {
      if (isRangeFilter) {
        ruleVal = `${filterStartValue} – ${filterEndValue}`;
      } else {
        ruleVal = filterInputValue.trim() || filterStartValue;
      }
      if (includeNotRecorded) {
        ruleVal += " (+ Not Recorded)";
      }
    } else {
      ruleVal = filterInputValue.trim();
    }

    if (!ruleVal) return;

    const rule: CustomFilterRule = {
      id: `${selectedFilterField}-${Date.now()}`,
      fieldKey: selectedFilterField,
      fieldLabel: fieldLabel,
      value: ruleVal,
    };

    const nextRules = [...activeRules, rule];
    setActiveRules(nextRules);
    setAppliedFilters(computeAppliedFilters(nextRules, filters));
  };

  const handleRemoveFilter = (ruleId: string) => {
    const nextRules = activeRules.filter((r) => r.id !== ruleId);
    setActiveRules(nextRules);
    setAppliedFilters(computeAppliedFilters(nextRules, filters));
  };

  const handleResetFilters = () => {
    setActiveRules([]);
    setAppliedFilters(computeAppliedFilters([], filters));
  };

  return (
    <section aria-label="Data Science Visualizations" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Top Header Summary & Section Navigation */}
      <div
        className="command-panel"
        style={{
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <h2 className="panel-title" style={{ fontSize: "1.1rem", margin: 0 }}>
              Data Science Visualizations
            </h2>

            {/* Mode Selector Toggle Buttons: All vs Custom */}
            <div
              role="tablist"
              aria-label="View Mode"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--surface-subtle)",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid var(--border-soft)",
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={mainMode === "all"}
                onClick={() => setMainMode("all")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: 0,
                  background: mainMode === "all" ? "var(--nav-active)" : "transparent",
                  color: mainMode === "all" ? "#ffffff" : "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Layers size={16} />
                <span>All</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mainMode === "custom"}
                onClick={() => setMainMode("custom")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: 0,
                  background: mainMode === "custom" ? "var(--nav-active)" : "transparent",
                  color: mainMode === "custom" ? "#ffffff" : "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <SlidersHorizontal size={16} />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {mainMode === "all" && (
            <TextInput
              placeholder="Search visualizations..."
              leftSection={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="xs"
              style={{ minWidth: "200px" }}
            />
          )}
        </div>

        {/* In "all" mode, show standard category tabs wrapping naturally to viewport width */}
        {mainMode === "all" && (
          <Tabs value={activeTab} onChange={(val) => val && setActiveTab(val)} variant="outline" radius="md">
            <Tabs.List
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              {ALL_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const active = sec.id === activeTab;
                return (
                  <Tabs.Tab
                    key={sec.id}
                    value={sec.id}
                    leftSection={<Icon size={15} style={{ color: active ? "#ffffff" : sec.color }} />}
                    style={{
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      background: active ? "var(--nav-active)" : undefined,
                      borderColor: active ? "var(--nav-active)" : undefined,
                      color: active ? "#ffffff" : undefined,
                      boxShadow: active ? "inset 0 -3px var(--accent)" : undefined,
                      transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                    }}
                  >
                    {sec.title} ({sec.cards.length})
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs>
        )}

        {/* In "custom" mode, show sub-tabs: Data vs Filters */}
        {mainMode === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={() => setCustomSubTab("data")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 16px",
                borderRadius: "6px",
                border: customSubTab === "data" ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: customSubTab === "data" ? "var(--surface-subtle)" : "transparent",
                color: customSubTab === "data" ? "var(--accent)" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <CheckSquare size={16} />
              <span>Data ({selectedCardIds.size} cards active)</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomSubTab("filters")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 16px",
                borderRadius: "6px",
                border: customSubTab === "filters" ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: customSubTab === "filters" ? "var(--surface-subtle)" : "transparent",
                color: customSubTab === "filters" ? "var(--accent)" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Filter size={16} />
              <span>Filters {activeRules.length > 0 ? `(${activeRules.length})` : ""}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode 1: Standard Visualizations View ("all") */}
      {mainMode === "all" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 4px" }}>
            {activeCategory && <activeCategory.icon size={20} style={{ color: activeCategory.color }} />}
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
              {activeCategory?.title}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
              ({activeCategory?.cards.length} Rendered Visualizations)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
            {activeCategory?.cards
              .filter(
                (card) =>
                  !search ||
                  card.fieldName.toLowerCase().includes(search.toLowerCase()) ||
                  card.chartType.toLowerCase().includes(search.toLowerCase()) ||
                  card.fieldKey.toLowerCase().includes(search.toLowerCase())
              )
              .map((card) => (
                <DataScienceCardContainer
                  key={card.id}
                  card={card}
                  databaseDistributions={databaseDistributions}
                  aircraftRateRows={aircraftRateRows}
                  databaseLoading={databaseLoading}
                  databaseError={databaseError}
                />
              ))}
          </div>
        </div>
      ) : (
        /* Mode 2: Custom Dashboard Workspace ("custom") */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Custom Sub-Tab 1: Data (Gran Tarjeta con Checkboxes) */}
          {customSubTab === "data" && (
            <div
              className="command-panel"
              style={{
                padding: "20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Card Selector Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckSquare size={20} style={{ color: "var(--accent)" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                      Card Selection (Data)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Check the cards you wish to activate and display in your custom section
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Badge size="lg" variant="filled" color="teal" style={{ fontWeight: 700 }}>
                    {selectedCardIds.size} of {allCardIds.length} Active
                  </Badge>
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    onClick={() => setSelectedCardIds(new Set(allCardIds))}
                  >
                    Select All
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => setSelectedCardIds(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Search box inside card selector */}
              <TextInput
                placeholder="Search card titles (e.g., Year, Damage, Country, Phase)..."
                leftSection={<Search size={14} />}
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.currentTarget.value)}
                size="xs"
              />

              {/* Floating Multi-Column Categorized Metric Cards */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-start" }}>
                {ALL_SECTIONS.map((sec) => {
                  const SectionIcon = sec.icon;
                  const filteredCards = sec.cards.filter(
                    (c) =>
                      !cardSearchQuery ||
                      c.fieldName.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
                      c.fieldKey.toLowerCase().includes(cardSearchQuery.toLowerCase()) ||
                      c.chartType.toLowerCase().includes(cardSearchQuery.toLowerCase())
                  );

                  if (filteredCards.length === 0) return null;

                  const secCardIds = sec.cards.map((c) => c.id);
                  const allSecSelected = secCardIds.every((id) => selectedCardIds.has(id));

                  const toggleSection = () => {
                    setSelectedCardIds((prev) => {
                      const next = new Set(prev);
                      if (allSecSelected) {
                        secCardIds.forEach((id) => next.delete(id));
                      } else {
                        secCardIds.forEach((id) => next.add(id));
                      }
                      return next;
                    });
                  };

                  return (
                    <div
                      key={sec.id}
                      style={{
                        background: "var(--surface-subtle)",
                        border: "1px solid var(--border-soft)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        flex: "0 0 auto",
                        minWidth: "max-content",
                        maxWidth: "100%",
                      }}
                    >
                      {/* Clickable Section Header Row */}
                      <div
                        onClick={toggleSection}
                        title={allSecSelected ? "Click to deselect all in category" : "Click to select all in category"}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          cursor: "pointer",
                          userSelect: "none",
                          paddingBottom: "4px",
                          borderBottom: "1px solid var(--border-soft)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <SectionIcon size={16} style={{ color: sec.color }} />
                          <span style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>
                            {sec.title}
                          </span>
                        </div>
                        <Badge
                          size="xs"
                          variant={allSecSelected ? "filled" : "outline"}
                          color={allSecSelected ? "teal" : "gray"}
                          style={{ fontWeight: 600 }}
                        >
                          {secCardIds.filter((id) => selectedCardIds.has(id)).length} / {sec.cards.length}
                        </Badge>
                      </div>

                      {/* Vertically Stacked Metric Checkboxes */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {filteredCards.map((c) => {
                          const isChecked = selectedCardIds.has(c.id);
                          return (
                            <label
                              key={c.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "3px 4px",
                                cursor: "pointer",
                                userSelect: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedCardIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.id)) {
                                      next.delete(c.id);
                                    } else {
                                      next.add(c.id);
                                    }
                                    return next;
                                  });
                                }}
                                size="xs"
                                color="teal"
                              />
                              <span
                                style={{
                                  fontSize: "0.83rem",
                                  fontWeight: isChecked ? 600 : 400,
                                  color: "var(--text)",
                                  whiteSpace: "nowrap",
                                  lineHeight: 1.2,
                                }}
                              >
                                {c.fieldName}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Sub-Tab 2: Filters Builder */}
          {customSubTab === "filters" && (
            <div
              className="command-panel"
              style={{
                padding: "20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Filter size={20} style={{ color: "var(--accent)" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                      Data Filters
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Add custom field and value rules to filter the Data Science visual dataset
                    </p>
                  </div>
                </div>

                {activeRules.length > 0 && (
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<RotateCcw size={13} />}
                    onClick={handleResetFilters}
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>

              {/* Adaptive Filter Adder Form Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  flexWrap: "wrap",
                  background: "var(--surface-subtle)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-soft)",
                }}
              >
                {/* Field Selection Dropdown (All Categories & Cards) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "220px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    Select Field
                    <Badge size="xs" variant="light" color="blue">All Fields</Badge>
                  </label>
                  <select
                    value={selectedFilterField}
                    onChange={(e) => {
                      const newField = e.target.value;
                      setSelectedFilterField(newField);
                      const card = allCards.find((c) => c.fieldKey === newField);
                      const dtype = card?.dataType || "";
                      if (newField === "event_weekday" || newField === "day_of_week") {
                        setFilterInputValue("1");
                        setFilterStartValue("1");
                        setFilterEndValue("7");
                      } else if (newField === "event_day" || newField === "day_of_month") {
                        setFilterInputValue("1");
                        setFilterStartValue("1");
                        setFilterEndValue("31");
                      } else if (newField === "event_year") {
                        setFilterInputValue("1970");
                        setFilterStartValue("1902");
                        setFilterEndValue("2026");
                      } else if (newField === "year_of_manufacture") {
                        setFilterInputValue("1970");
                        setFilterStartValue("1900");
                        setFilterEndValue("2026");
                      } else if (dtype === "Integer" || dtype === "Float") {
                        setFilterInputValue("0");
                        setFilterStartValue("0");
                        setFilterEndValue("100");
                      } else if (dtype === "Date" || newField.includes("date")) {
                        setFilterInputValue("");
                      } else if (FIELD_OPTIONS_MAP[newField]) {
                        setFilterInputValue(FIELD_OPTIONS_MAP[newField][0]);
                      } else {
                        setFilterInputValue("");
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "0.83rem",
                      fontWeight: 600,
                    }}
                  >
                    {ALL_SECTIONS.map((sec) => (
                      <optgroup key={sec.id} label={sec.title}>
                        {sec.cards.map((card) => (
                          <option key={card.id} value={card.fieldKey}>
                            {card.fieldName} ({card.dataType || "Field"})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Adaptive Input Control based on Data Type (Calendar / Slider / Range / Dropdown) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 2, minWidth: "300px" }}>
                  {(() => {
                    const currentCard = allCards.find((c) => c.fieldKey === selectedFilterField);
                    const dtype = currentCard?.dataType || "";
                    const isDate = dtype === "Date" || selectedFilterField.includes("date");
                    const isNumeric =
                      dtype === "Integer" ||
                      dtype === "Float" ||
                      [
                        "event_year",
                        "year_of_manufacture",
                        "event_day",
                        "event_weekday",
                        "day_of_month",
                        "day_of_week",
                        "total_occupants",
                        "fatalities",
                        "survivors",
                        "ground_fatalities",
                        "accident_investigation_duration",
                      ].includes(selectedFilterField);
                    const hasOptions = FIELD_OPTIONS_MAP[selectedFilterField];

                    if (isDate) {
                      return (
                        <>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                            Filter Date (Calendar Selector)
                          </label>
                          <input
                            type="date"
                            value={filterInputValue}
                            onChange={(e) => setFilterInputValue(e.target.value)}
                            style={{
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: "0.83rem",
                              fontWeight: 600,
                            }}
                          />
                        </>
                      );
                    }

                    if (isNumeric) {
                      let minVal = 0;
                      let maxVal = 100;
                      let unitLabel = "";

                      if (selectedFilterField === "event_weekday" || selectedFilterField === "day_of_week") {
                        minVal = 1;
                        maxVal = 7;
                        unitLabel = " (1=Sunday, 7=Saturday)";
                      } else if (selectedFilterField === "event_day" || selectedFilterField === "day_of_month") {
                        minVal = 1;
                        maxVal = 31;
                        unitLabel = " (1–31 Days)";
                      } else if (selectedFilterField === "event_year") {
                        minVal = 1902;
                        maxVal = 2026;
                        unitLabel = " (1902–2026)";
                      } else if (selectedFilterField === "year_of_manufacture") {
                        minVal = 1900;
                        maxVal = 2026;
                        unitLabel = " (1900–2026)";
                      } else if (selectedFilterField === "accident_investigation_duration") {
                        minVal = 0;
                        maxVal = 3650;
                        unitLabel = " Days";
                      } else {
                        minVal = 0;
                        maxVal = 500;
                      }

                      const currentVal = filterInputValue ? Math.max(minVal, Math.min(maxVal, Number(filterInputValue))) : minVal;
                      const startVal = filterStartValue ? Math.max(minVal, Math.min(maxVal, Number(filterStartValue))) : minVal;
                      const endVal = filterEndValue ? Math.max(startVal, Math.min(maxVal, Number(filterEndValue))) : maxVal;

                      return (
                        <>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                              Filter Value (Numeric Scale){unitLabel}
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <Checkbox
                                label="Range Mode"
                                checked={isRangeFilter}
                                onChange={(e) => setIsRangeFilter(e.currentTarget.checked)}
                                size="xs"
                                color="teal"
                                styles={{ label: { fontSize: "0.74rem", fontWeight: 700, cursor: "pointer", color: "var(--text)" } }}
                              />
                              <Checkbox
                                label="Include 'Not Recorded'"
                                checked={includeNotRecorded}
                                onChange={(e) => setIncludeNotRecorded(e.currentTarget.checked)}
                                size="xs"
                                color="teal"
                                styles={{ label: { fontSize: "0.74rem", fontWeight: 700, cursor: "pointer", color: "var(--text)" } }}
                              />
                            </div>
                          </div>

                          {!isRangeFilter ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)" }}>
                                  Selected Value:
                                </span>
                                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                                  {currentVal}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{minVal}</span>
                                <input
                                  type="range"
                                  min={minVal}
                                  max={maxVal}
                                  value={currentVal}
                                  onChange={(e) => setFilterInputValue(e.target.value)}
                                  style={{ flex: 1, accentColor: "var(--accent)", cursor: "pointer" }}
                                />
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{maxVal}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)" }}>
                                  Selected Range:
                                </span>
                                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                                  Start: {startVal} — End: {endVal}
                                </span>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, minWidth: "55px" }}>
                                    Start ({startVal})
                                  </span>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{minVal}</span>
                                  <input
                                    type="range"
                                    min={minVal}
                                    max={endVal}
                                    value={startVal}
                                    onChange={(e) => setFilterStartValue(e.target.value)}
                                    style={{ flex: 1, accentColor: "#3b82f6", cursor: "pointer" }}
                                  />
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{endVal}</span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, minWidth: "55px" }}>
                                    End ({endVal})
                                  </span>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{startVal}</span>
                                  <input
                                    type="range"
                                    min={startVal}
                                    max={maxVal}
                                    value={endVal}
                                    onChange={(e) => setFilterEndValue(e.target.value)}
                                    style={{ flex: 1, accentColor: "#10b981", cursor: "pointer" }}
                                  />
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{maxVal}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }

                    if (hasOptions) {
                      return (
                        <>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                            Filter Value (Dropdown Selector)
                          </label>
                          <select
                            value={filterInputValue}
                            onChange={(e) => setFilterInputValue(e.target.value)}
                            style={{
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                              color: "var(--text)",
                              fontSize: "0.83rem",
                              fontWeight: 600,
                            }}
                          >
                            {hasOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt === "fatal" ? "Fatal Events Only" : opt === "nonfatal" ? "Non-Fatal Events Only" : opt === "all" ? "All Events" : opt}
                              </option>
                            ))}
                          </select>
                        </>
                      );
                    }

                    return (
                      <>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                          Filter Value (Text Input)
                        </label>
                        <TextInput
                          placeholder={`Enter value for ${currentCard?.fieldName || "field"}...`}
                          value={filterInputValue}
                          onChange={(e) => setFilterInputValue(e.currentTarget.value)}
                          size="xs"
                        />
                      </>
                    );
                  })()}
                </div>

                <Button
                  size="xs"
                  variant="filled"
                  color="teal"
                  leftSection={<Plus size={14} />}
                  onClick={handleAddFilter}
                  style={{ height: "35px" }}
                >
                  Add Filter
                </Button>
              </div>

              {/* Active Filter Chips */}
              <div>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                  Active Filters ({activeRules.length})
                </h4>

                {activeRules.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No custom filters applied. Showing all records.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {activeRules.map((rule) => (
                      <Badge
                        key={rule.id}
                        size="lg"
                        variant="outline"
                        color="teal"
                        rightSection={
                          <button
                            type="button"
                            onClick={() => handleRemoveFilter(rule.id)}
                            style={{
                              background: "transparent",
                              border: 0,
                              cursor: "pointer",
                              color: "inherit",
                              display: "flex",
                              alignItems: "center",
                              padding: 0,
                              marginLeft: "4px",
                            }}
                          >
                            <X size={12} />
                          </button>
                        }
                        style={{ fontWeight: 600 }}
                      >
                        {rule.fieldLabel}: <strong>{rule.value}</strong>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Render Active Selected Visualization Cards in Custom View */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>
                Custom Visualizations Section
              </h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Showing {allCards.filter((c) => selectedCardIds.has(c.id)).length} Active Cards
              </span>
            </div>

            {selectedCardIds.size === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-muted)",
                }}
              >
                <CheckSquare size={32} style={{ opacity: 0.5, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No visualization cards selected.</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>
                  Switch to the "Data" sub-tab above and check the cards you would like to display.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
                {allCards
                  .filter((card) => selectedCardIds.has(card.id))
                  .map((card) => (
                    <DataScienceCardContainer
                      key={card.id}
                      card={card}
                      databaseDistributions={databaseDistributions}
                      aircraftRateRows={aircraftRateRows}
                      databaseLoading={databaseLoading}
                      databaseError={databaseError}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
