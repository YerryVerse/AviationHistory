"use client";

import { Badge, Group, Loader, SimpleGrid, Table, Text, TextInput } from "@mantine/core";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Globe2, Plane, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import GlobalFlightsChart, { type GlobalFlightPoint } from "@/components/charts/GlobalFlightsChart";

export default function GlobalFlightsView() {
  const [data, setData] = useState<GlobalFlightPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFlights() {
      try {
        const res = await fetch("/data/flights/global_annual_flights.csv");
        if (!res.ok) throw new Error("Failed to load flights data");
        const text = await res.text();
        const lines = text.trim().split("\n");
        const rows: GlobalFlightPoint[] = [];

        // Parse CSV
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          // Split by comma handling possible quoted text
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length >= 7) {
            const year = parseInt(cols[0], 10);
            const total_flights = parseInt(cols[1], 10);
            if (!isNaN(year) && !isNaN(total_flights)) {
              rows.push({
                year,
                total_flights,
                coverage: cols[2],
                status: cols[3],
                source: cols[4],
                source_url: cols[5],
                notes: cols[6],
              });
            }
          }
        }

        // Sort ascending to calculate YoY
        rows.sort((a, b) => a.year - b.year);
        for (let i = 0; i < rows.length; i++) {
          if (i > 0 && rows[i - 1].total_flights > 0) {
            const prev = rows[i - 1].total_flights;
            const curr = rows[i].total_flights;
            rows[i].yoyGrowth = ((curr - prev) / prev) * 100;
          } else {
            rows[i].yoyGrowth = null;
          }
        }

        if (active) {
          setData(rows);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading flights CSV:", err);
        if (active) setLoading(false);
      }
    }

    loadFlights();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const totalFlightsSum = data.reduce((acc, r) => acc + r.total_flights, 0);
    const peak = [...data].reduce((max, r) => (r.total_flights > max.total_flights ? r : max), data[0]);
    const latest2024 = data.find((r) => r.year === 2024) ?? data[data.length - 1];
    const covid2020 = data.find((r) => r.year === 2020);

    return {
      totalFlightsSum,
      peak,
      latest2024,
      covid2020,
    };
  }, [data]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sortedDesc = [...data].sort((a, b) => b.year - a.year);
    if (!term) return sortedDesc;
    return sortedDesc.filter(
      (r) =>
        r.year.toString().includes(term) ||
        r.status.toLowerCase().includes(term) ||
        r.source.toLowerCase().includes(term) ||
        r.notes.toLowerCase().includes(term)
    );
  }, [data, search]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
        <Loader size="md" color="teal" />
      </div>
    );
  }

  return (
    <section>
      {/* KPI Cards Header */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
          <article className="command-panel" style={{ padding: "16px 20px" }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed" fw={700} style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Recorded Flights
              </Text>
              <Globe2 size={18} color="#0284c7" />
            </Group>
            <Text size="xl" fw={900} style={{ fontFamily: "Roboto Mono, monospace", letterSpacing: "-0.02em" }}>
              {stats.totalFlightsSum.toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Cumulative departures (1970–2026)
            </Text>
          </article>

          <article className="command-panel" style={{ padding: "16px 20px" }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed" fw={700} style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                All-Time Peak Year
              </Text>
              <TrendingUp size={18} color="#10b981" />
            </Group>
            <Text size="xl" fw={900} style={{ fontFamily: "Roboto Mono, monospace", letterSpacing: "-0.02em" }}>
              {stats.peak.total_flights.toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {stats.peak.year === 2019 ? "Pre-COVID historical high (2019)" : `Peak reached in ${stats.peak.year} (IATA benchmark)`}
            </Text>
          </article>

          <article className="command-panel" style={{ padding: "16px 20px" }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed" fw={700} style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                2024 Global Volume
              </Text>
              <Plane size={18} color="#0284c7" />
            </Group>
            <Text size="xl" fw={900} style={{ fontFamily: "Roboto Mono, monospace", letterSpacing: "-0.02em" }}>
              {stats.latest2024.total_flights.toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {stats.latest2024.yoyGrowth != null ? `+${stats.latest2024.yoyGrowth.toFixed(1)}% vs 2023` : "IATA official benchmark"}
            </Text>
          </article>

          <article className="command-panel" style={{ padding: "16px 20px" }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed" fw={700} style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                COVID-19 Impact (2020)
              </Text>
              <ArrowDownRight size={18} color="#ef4444" />
            </Group>
            <Text size="xl" fw={900} style={{ fontFamily: "Roboto Mono, monospace", color: "#ef4444", letterSpacing: "-0.02em" }}>
              {stats.covid2020?.total_flights.toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {stats.covid2020?.yoyGrowth != null ? `${stats.covid2020.yoyGrowth.toFixed(1)}% YoY contraction` : "Pandemic trough"}
            </Text>
          </article>
        </SimpleGrid>
      )}

      {/* Main Chart Panel */}
      <article className="command-panel" style={{ marginBottom: 16 }}>
        <header className="panel-heading">
          <div>
            <h2 className="panel-title">Global Flights Timeline (1970–2026)</h2>
            <p className="panel-subtitle">
              Worldwide registered carrier departures based on World Bank WDI (IS.AIR.DPRT), ICAO, and IATA benchmarks
            </p>
          </div>
        </header>
        <GlobalFlightsChart data={data} />
      </article>

      {/* Breakdown Data Table Panel */}
      <article className="command-panel" style={{ padding: "18px 22px" }}>
        <Group justify="space-between" mb="md" wrap="wrap">
          <div>
            <h3 className="panel-title" style={{ fontSize: "1rem", marginBottom: 2 }}>
              Annual Departure History ({data.length} Years)
            </h3>
            <p className="panel-subtitle">
              Official annual records with year-over-year rate of change and statistical provenance
            </p>
          </div>
          <TextInput
            placeholder="Filter by year or source…"
            leftSection={<Search size={14} />}
            size="xs"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 240 }}
          />
        </Group>

        <div style={{ overflowX: "auto" }}>
          <Table striped highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 90 }}>Year</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Total Departures</Table.Th>
                <Table.Th style={{ textAlign: "right", width: 130 }}>YoY Change</Table.Th>
                <Table.Th style={{ width: 130 }}>Status</Table.Th>
                <Table.Th>Source & Provenance</Table.Th>
                <Table.Th style={{ width: 40 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRows.map((row) => {
                const isPositive = row.yoyGrowth != null && row.yoyGrowth >= 0;
                const isNegative = row.yoyGrowth != null && row.yoyGrowth < 0;
                return (
                  <Table.Tr key={row.year}>
                    <Table.Td>
                      <strong style={{ fontFamily: "Roboto Mono, monospace" }}>{row.year}</strong>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right", fontFamily: "Roboto Mono, monospace", fontWeight: 700 }}>
                      {row.total_flights.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      {row.yoyGrowth != null ? (
                        <Badge
                          variant="light"
                          color={isPositive ? "teal" : "red"}
                          size="sm"
                          leftSection={isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        >
                          {isPositive ? `+${row.yoyGrowth.toFixed(1)}%` : `${row.yoyGrowth.toFixed(1)}%`}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          —
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="dot"
                        color={row.status === "actual" ? "blue" : row.status === "estimate" ? "orange" : "cyan"}
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={500}>
                        {row.source}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ fontSize: "0.72rem" }}>
                        {row.notes}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {row.source_url && (
                        <a
                          href={row.source_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", opacity: 0.6 }}
                          title="Open official data source"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      </article>
    </section>
  );
}
