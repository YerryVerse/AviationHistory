"use client";

import { Alert, Skeleton } from "@mantine/core";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchQualityReport } from "@/lib/staticData/quality";
import type { ColumnQualityReport, QualityReport } from "@/lib/staticData/types";


type SortKey = "field" | "valid" | "invalid" | "null" | "qualityPercent";
type SortDirection = "asc" | "desc";

const HEADERS: Array<{ key: SortKey; label: string }> = [
  { key: "field", label: "Column" },
  { key: "valid", label: "Valid" },
  { key: "invalid", label: "Invalid" },
  { key: "null", label: "Null" },
  { key: "qualityPercent", label: "Quality %" },
];

const MARKER_LABELS: Record<string, string> = {
  database_null: "Database null", blank: "Blank", unknown: "Unknown", "n/a": "N/A",
  none: "None", nan: "NaN", undefined: "Undefined", dash: "Dash (-)",
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function qualityClass(value: number): string {
  if (value === 100) return "quality-perfect";
  if (value >= 80) return "quality-good";
  if (value >= 60) return "quality-warning";
  return "quality-critical";
}

function formatQuality(value: number): string {
  if (value < 100 && Number(value.toFixed(1)) >= 100) return "99.9%";
  return `${value.toFixed(1)}%`;
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ChevronsUpDown aria-hidden size={14} />;
  return direction === "asc" ? <ArrowUp aria-hidden size={14} /> : <ArrowDown aria-hidden size={14} />;
}

function Statistics({ column }: { column: ColumnQualityReport }) {
  if (!column.statistics) return <p className="quality-empty">Not applicable</p>;
  const entries = Object.entries(column.statistics).filter(([key]) => key !== "kind");
  return (
    <dl className="quality-stat-grid">
      {entries.map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{typeof value === "number" ? formatNumber(Math.round(value * 100) / 100) : value}</dd></div>)}
    </dl>
  );
}

const HIDDEN_FIELDS = new Set<string>([]);


export function QualityReportView({ report, defaultHidePerfect = false }: { report: QualityReport; defaultHidePerfect?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("qualityPercent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [hidePerfect, setHidePerfect] = useState(defaultHidePerfect);
  const perfectCount = useMemo(() => report.columns.filter((col) => col.qualityPercent === 100).length, [report.columns]);
  const filteredColumns = useMemo(
    () => report.columns.filter((col) => !HIDDEN_FIELDS.has(col.field) && (!hidePerfect || col.qualityPercent < 100)),
    [report.columns, hidePerfect],
  );
  const [selectedField, setSelectedField] = useState("");

  useEffect(() => {
    if (filteredColumns.length > 0 && (!selectedField || !filteredColumns.some(c => c.field === selectedField))) {
      setSelectedField(filteredColumns[0].field);
    }
  }, [filteredColumns, selectedField]);

  const canonicalIndex = useMemo(() => new Map(filteredColumns.map((column, index) => [column.field, index])), [filteredColumns]);
  const columns = useMemo(() => [...filteredColumns].sort((left, right) => {
    const a = sortKey === "field" ? left.label.toLowerCase() : left[sortKey];
    const b = sortKey === "field" ? right.label.toLowerCase() : right[sortKey];
    const comparison = typeof a === "string" && typeof b === "string" ? a.localeCompare(b) : Number(a) - Number(b);
    if (comparison) return sortDirection === "asc" ? comparison : -comparison;
    return (canonicalIndex.get(left.field) ?? 0) - (canonicalIndex.get(right.field) ?? 0);
  }), [canonicalIndex, filteredColumns, sortDirection, sortKey]);
  const selected = filteredColumns.find((column) => column.field === selectedField) ?? filteredColumns[0];

  const sort = (key: SortKey) => {
    if (key === sortKey) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection(key === "field" ? "asc" : "desc");
    }
  };

  if (!selected && filteredColumns.length === 0 && report.columns.length > 0) {
    return (
      <section className="quality-workspace" aria-label="Column data quality">
        <article className="command-panel quality-summary-card">
          <div className="quality-card-heading">
            <div>
              <h2 className="panel-title">Column quality summary</h2>
              <p className="panel-subtitle">{formatNumber(report.totalRows)} records · All {report.columns.length} columns at 100% quality!</p>
            </div>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={hidePerfect}
                onChange={(e) => setHidePerfect(e.target.checked)}
              />
              Hide 100% Quality Columns
            </label>
          </div>
          <Alert color="green" title="All columns are 100% quality!">
            All columns currently have 100% data quality. Uncheck "Hide 100% Quality Columns" above to view all columns.
          </Alert>
        </article>
      </section>
    );
  }

  if (!selected) return <Alert color="yellow">The quality report contains no columns.</Alert>;

  return (
    <section className="quality-workspace" aria-label="Column data quality">
      <article className="command-panel quality-summary-card">
        <div className="quality-card-heading">
          <div>
            <h2 className="panel-title">Column quality summary</h2>
            <p className="panel-subtitle">
              {formatNumber(report.totalRows)} records · {filteredColumns.length} shown of {report.columns.length} analytical columns · {perfectCount} at 100%
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={hidePerfect}
                onChange={(e) => setHidePerfect(e.target.checked)}
              />
              Hide 100% Quality Columns
            </label>
            <p className="quality-formula">Quality = valid ÷ total</p>
          </div>
        </div>
        <div className="quality-table-scroll">
          <table className="quality-table">
            <thead><tr>{HEADERS.map((header) => (
              <th key={header.key} scope="col" className={`col-${header.key}`}><button type="button" onClick={() => sort(header.key)} aria-label={`Sort by ${header.label} ${sortKey === header.key ? sortDirection : ""}`}>{header.label}<SortIcon active={sortKey === header.key} direction={sortDirection} /></button></th>
            ))}</tr></thead>
            <tbody>{columns.map((column) => {
              const selectedRow = column.field === selected.field;
              return (
                <tr key={column.field} className={selectedRow ? "is-selected" : ""} aria-selected={selectedRow}>
                  <td className="col-field"><button type="button" className="quality-column-select" aria-label={`Select ${column.label}`} onClick={() => setSelectedField(column.field)}><strong>{column.label}</strong><span>{column.field}</span></button></td>
                  <td className="col-valid">{formatNumber(column.valid)}</td>
                  <td className="col-invalid">{formatNumber(column.invalid)}</td>
                  <td className="col-null">{formatNumber(column.null)}</td>
                  <td className="col-qualityPercent"><span data-testid={`quality-score-${column.field}`} className={`quality-score ${qualityClass(column.qualityPercent)}`}>{formatQuality(column.qualityPercent)}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </article>

      <article className="command-panel quality-detail-card" aria-live="polite">
        <div className="quality-detail-heading">
          <div><p className="quality-eyebrow">Selected column</p><h2 className="panel-title">{selected.label}</h2><code>{selected.field}</code></div>
          <span className={`quality-score quality-score-large ${qualityClass(selected.qualityPercent)}`}>{formatQuality(selected.qualityPercent)}</span>
        </div>
        <div className="quality-detail-metrics">
          {[['Type', selected.dataType], ['Total', formatNumber(selected.total)], ['Valid', formatNumber(selected.valid)], ['Invalid', formatNumber(selected.invalid)], ['Null', formatNumber(selected.null)], ['Unique', formatNumber(selected.uniqueCount)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
        <div className="quality-detail-grid">
          <section><h3>Null markers</h3><dl className="quality-breakdown">{selected.nullBreakdown.map((item) => <div key={item.marker}><dt>{MARKER_LABELS[item.marker] ?? item.marker}</dt><dd>{formatNumber(item.count)}</dd></div>)}</dl></section>
          <section><h3>Invalid values</h3>{selected.invalidBreakdown.length ? <div className="quality-rule-list">{selected.invalidBreakdown.map((rule) => <article key={rule.ruleId}><div><strong>{rule.description}</strong><span>{formatNumber(rule.count)}</span></div>{rule.examples.length ? <ul>{rule.examples.map((example) => <li key={example}><code>{example}</code></li>)}</ul> : null}</article>)}</div> : <p className="quality-empty">No invalid values</p>}</section>
          <section><h3>Most frequent values</h3>{selected.topValues.length ? <ol className="quality-top-values">{selected.topValues.map((item) => <li key={item.value}><span>{item.value}</span><strong>{formatNumber(item.count)}</strong></li>)}</ol> : <p className="quality-empty">No frequent values</p>}</section>
          <section><h3>Statistics</h3><Statistics column={selected} /></section>
        </div>
      </article>
    </section>
  );
}

export default function DataQuality() {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchQualityReport(process.env.NEXT_PUBLIC_BASE_PATH ?? "", controller.signal)
      .then(setReport)
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => controller.abort();
  }, []);

  if (error) return <Alert icon={<AlertTriangle size={18} />} color="red" title="The quality report could not be loaded">{error}</Alert>;
  if (!report) return <div className="quality-loading" aria-label="Loading data quality report"><Skeleton height={480} radius="md" /><Skeleton height={360} radius="md" /></div>;
  return <QualityReportView report={report} />;
}
