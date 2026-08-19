"use client";

import { ActionIcon, Button, MultiSelect as MantineMultiSelect, Select, TextInput } from "@mantine/core";
import { Check, Columns, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { EventFieldFilter, EventRow, PagedEvents } from "@/lib/staticData/types";

interface TableDatasetProps {
  events: PagedEvents | null;
  page: number;
  onPageChange(page: number): void;
  loading?: boolean;
  filterableFields: string[];
  fieldFilters: EventFieldFilter[];
  onFieldFiltersChange(filters: EventFieldFilter[]): void;
}

const DEFAULT_FILTER_FIELD = "title";

const ALL_57_FIELDS = [
  "asn_id",
  "event_date",
  "event_year",
  "event_month",
  "event_day",
  "event_weekday",
  "local_time",
  "title",
  "category",
  "icao_occurrence_category",
  "confidence_rating",
  "aircraft_type",
  "aircraft_designation",
  "aircraft_manufacturer",
  "aircraft_name",
  "aircraft_model",
  "aircraft_variant",
  "aircraft_common_name",
  "operator",
  "registration",
  "msn",
  "year_of_manufacture",
  "engine_model",
  "cycles",
  "total_airframe_hrs",
  "aircraft_damage",
  "aircraft_disposition",
  "history_of_this_aircraft",
  "occupants",
  "fatalities_onboard",
  "survivors_onboard",
  "fatalities_ground",
  "fatalities_total",
  "survival_rate_onboard",
  "fatality_rate_onboard",
  "location",
  "country",
  "continent",
  "region",
  "gps_latitude",
  "gps_longitude",
  "phase",
  "phase_group",
  "nature",
  "departure_airport",
  "departure_iata",
  "destination_airport",
  "destination_iata",
  "metar",
  "weather_or_visibility_mentioned",
  "investigating_agency",
  "accident_investigation_duration",
  "accident_investigation_report",
  "accident_investigation_report_number",
  "accident_investigation_status",
  "narrative",
  "aircraft_image_url"
];

function labelForField(field: string): string {
  if (field === "asn_id") return "ASN ID";
  if (field === "gps_latitude") return "Latitude (GPS)";
  if (field === "gps_longitude") return "Longitude (GPS)";
  if (field === "departure_iata") return "Dep IATA";
  if (field === "destination_iata") return "Dest IATA";
  if (field === "msn") return "MSN";
  return field.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderFormattedCell(event: EventRow, colKey: string) {
  const val = event[colKey];
  if (val === null || val === undefined || val === "" || val === "nan" || val === "NaN") {
    return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>-</span>;
  }

  if (colKey === "asn_id") return <span className="recent-date">{String(val)}</span>;
  if (colKey === "event_date" || colKey === "event_year") return <strong>{String(val)}</strong>;
  if (colKey === "title") return <span title={String(val)} style={{ fontWeight: 600 }}>{String(val)}</span>;
  if (colKey === "fatalities_total") {
    const num = Number(val);
    return (
      <span style={{ fontWeight: 700, color: num > 0 ? "#ef4444" : "#10b981" }}>
        {String(val)}
      </span>
    );
  }
  if (colKey === "aircraft_image_url" && typeof val === "string" && val.startsWith("http")) {
    return (
      <a href={val} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>
        View Image
      </a>
    );
  }
  return <span title={String(val)}>{String(val)}</span>;
}

export default function TableDataset({
  events,
  page,
  onPageChange,
  loading = false,
  filterableFields,
  fieldFilters,
  onFieldFiltersChange,
}: TableDatasetProps) {
  const rows = events?.rows ?? [];

  // Combine schema fields or default to all 57 analytical fields
  const availableColumns = useMemo(() => {
    const combined = Array.from(new Set(["asn_id", ...filterableFields, ...ALL_57_FIELDS]));
    return combined;
  }, [filterableFields]);

  // ALL columns activated by default
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const fieldOptions = filterableFields.map((field) => ({ value: field, label: labelForField(field) }));
  const fallbackField = filterableFields.includes(DEFAULT_FILTER_FIELD) ? DEFAULT_FILTER_FIELD : filterableFields[0] ?? "";

  const addFilter = () => {
    if (!fallbackField) return;
    onFieldFiltersChange([...fieldFilters, { field: fallbackField, value: "" }]);
  };
  const updateFilter = (index: number, next: Partial<EventFieldFilter>) => {
    onFieldFiltersChange(fieldFilters.map((filter, currentIndex) => (currentIndex === index ? { ...filter, ...next } : filter)));
  };
  const removeFilter = (index: number) => {
    onFieldFiltersChange(fieldFilters.filter((_, currentIndex) => currentIndex !== index));
  };

  const selectAllColumns = () => setSelectedColumns(availableColumns);
  const deselectAllColumns = () => setSelectedColumns(["asn_id", "event_date", "title"]);

  return (
    <section className="command-panel" aria-label="Filtered aviation events">
      <header className="event-table-filter-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 className="panel-title">Field filters</h2>
          <Button size="xs" variant="light" leftSection={<Plus size={14} />} onClick={addFilter} disabled={!filterableFields.length}>
            Add filter
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="badge"
            style={{
              fontSize: "0.75rem",
              padding: "4px 10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              borderRadius: "12px",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>✓</span> {selectedColumns.length} / {availableColumns.length} Columns Active
          </span>
          <Button
            size="xs"
            variant="outline"
            leftSection={<Columns size={14} />}
            onClick={() => setShowColumnPicker((prev) => !prev)}
          >
            {showColumnPicker ? "Hide Column Picker" : "Manage Columns"}
          </Button>
        </div>
      </header>

      {showColumnPicker && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--surface-subtle)",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Select Visible Columns ({selectedColumns.length} Active):</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <Button size="xs" variant="subtle" leftSection={<Check size={12} />} onClick={selectAllColumns}>
                Select All ({availableColumns.length})
              </Button>
              <Button size="xs" variant="subtle" color="red" leftSection={<X size={12} />} onClick={deselectAllColumns}>
                Minimal (3)
              </Button>
            </div>
          </div>
          <MantineMultiSelect
            data={availableColumns.map((col) => ({ value: col, label: labelForField(col) }))}
            value={selectedColumns}
            onChange={setSelectedColumns}
            searchable
            clearable
            placeholder="Select columns to show in table..."
          />
        </div>
      )}

      {fieldFilters.length ? (
        <div className="event-table-filters">
          {fieldFilters.map((filter, index) => (
            <div className="event-table-filter-row" key={`${filter.field}-${index}`}>
              <Select
                aria-label={`Filter field ${index + 1}`}
                data={fieldOptions}
                searchable
                value={filter.field}
                onChange={(value) => updateFilter(index, { field: value ?? fallbackField })}
              />
              <TextInput
                aria-label={`Filter value ${index + 1}`}
                placeholder="Contains"
                value={filter.value}
                onChange={(event) => updateFilter(index, { value: event.currentTarget.value })}
              />
              <ActionIcon variant="subtle" color="red" aria-label={`Remove filter ${index + 1}`} onClick={() => removeFilter(index)}>
                <Trash2 size={16} />
              </ActionIcon>
            </div>
          ))}
        </div>
      ) : null}

      <header className="event-table-filter-header" style={{ marginTop: "0.5rem" }}>
        <h2 className="panel-title">Events ({availableColumns.length} Analytical Fields)</h2>
        <span
          className="badge"
          style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            background: "rgba(59, 130, 246, 0.15)",
            color: "#60a5fa",
            borderRadius: "12px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>📅</span> Sorted by Date (Newest First ↓)
        </span>
      </header>

      <div className="command-table-wrap" style={{ position: "relative" }}>
        <table className="command-table">
          <thead>
            <tr>
              {selectedColumns.map((colKey) => (
                <th key={colKey}>{labelForField(colKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ opacity: loading ? 0.45 : 1, transition: "opacity 150ms ease" }}>
            {rows.map((event) => (
              <tr key={event.asn_id}>
                {selectedColumns.map((colKey) => (
                  <td key={colKey}>{renderFormattedCell(event, colKey)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length ? <div className="status-state">No events match the current filters.</div> : null}

      <footer className="table-footer">
        <Button
          variant="default"
          size="xs"
          aria-label="Previous page"
          disabled={page === 1 || loading}
          loading={loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="panel-subtitle">Page {page}</span>
        <Button
          size="xs"
          aria-label="Next page"
          disabled={rows.length < (events?.limit ?? 50) || loading}
          loading={loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </footer>
    </section>
  );
}

