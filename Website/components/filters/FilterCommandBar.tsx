"use client";

import { ActionIcon, Button, Drawer, Group, NumberInput, Select } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RotateCcw, Share2, SlidersHorizontal } from "lucide-react";

import type { AnalyticsFilters, FilterOption } from "@/lib/staticData/types";


interface FilterCommandBarProps {
  filters: AnalyticsFilters;
  options: FilterOption[];
  onChange(next: Partial<AnalyticsFilters>): void;
  onReset(): void;
  onShare(): void;
}

function dimensionOptions(options: FilterOption[], dimension: string) {
  return options.filter((item) => item.dimension === dimension).map((item) => ({ value: item.value, label: item.value }));
}

export default function FilterCommandBar({ filters, options, onChange, onReset, onShare }: FilterCommandBarProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const activeCount = [
    filters.country ? 1 : 0,
    filters.operator ? 1 : 0,
    filters.phaseGroup ? 1 : 0,
    filters.severity !== "all" ? 1 : 0,
    filters.yearStart !== 1902 || filters.yearEnd !== 2026 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const fields = (
    <>
      <NumberInput label="From year" min={1902} max={filters.yearEnd} value={filters.yearStart} onChange={(value) => typeof value === "number" && onChange({ yearStart: value })} hideControls />
      <NumberInput label="To year" min={filters.yearStart} max={2026} value={filters.yearEnd} onChange={(value) => typeof value === "number" && onChange({ yearEnd: value })} hideControls />
      <Select label="Severity" value={filters.severity} onChange={(value) => onChange({ severity: (value ?? "all") as AnalyticsFilters["severity"] })} data={[{ value: "all", label: "All severities" }, { value: "fatal", label: "Fatal" }, { value: "nonfatal", label: "Non-fatal" }]} allowDeselect={false} />
      <Select searchable clearable label="Country" placeholder="All countries" value={filters.country ?? null} onChange={(value) => onChange({ country: value ?? undefined })} data={dimensionOptions(options, "country")} />
      <Select searchable clearable label="Operator" placeholder="All operators" value={filters.operator ?? null} onChange={(value) => onChange({ operator: value ?? undefined })} data={dimensionOptions(options, "operator")} />
      <Select searchable clearable label="Flight phase" placeholder="All phases" value={filters.phaseGroup ?? null} onChange={(value) => onChange({ phaseGroup: value ?? undefined })} data={dimensionOptions(options, "phase_group")} />
    </>
  );

  const actions = (
    <Group gap="xs" className="filter-actions" wrap="nowrap">
      <Button variant="default" leftSection={<RotateCcw size={14} />} aria-label="Reset filters" onClick={onReset}>Reset</Button>
      <ActionIcon variant="light" size={36} aria-label="Share filtered view" onClick={onShare}><Share2 size={16} /></ActionIcon>
    </Group>
  );

  return (
    <section className="filter-command-bar" aria-label="Dataset filters">
      <Button
        className="mobile-filter-trigger"
        variant="default"
        leftSection={<SlidersHorizontal size={16} />}
        aria-label="Open filters"
        onClick={open}
      >
        Filters · {filters.yearStart}–{filters.yearEnd} {activeCount > 0 ? `(${activeCount} active)` : ""}
      </Button>

      <div className="filter-command-grid">{fields}{actions}</div>

      <Drawer
        opened={opened}
        onClose={close}
        title="Dataset filters"
        position="bottom"
        size="88%"
        radius="md"
        className="filter-mobile-drawer"
      >
        <div className="filter-drawer-grid">
          {fields}
          <Group gap="sm" mt="md" grow className="filter-drawer-actions">
            <Button variant="default" leftSection={<RotateCcw size={14} />} onClick={onReset}>
              Reset all
            </Button>
            <Button variant="filled" onClick={close}>
              Apply filters
            </Button>
          </Group>
        </div>
      </Drawer>
    </section>
  );
}
