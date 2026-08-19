import * as duckdb from "@duckdb/duckdb-wasm";

import { withBasePath } from "./basePath";
import { getDuckDbClient } from "./duckdbClient";
import { fetchManifest, getYearAssets } from "./manifest";
import { buildAnnualTrendQuery, buildCountryRankingQuery, buildDashboardQuery, buildDataScienceAircraftRateQuery, buildDataScienceDistributionQuery, buildEventLookupQuery, buildEventsPageQuery, buildFilterOptionsQuery, buildMapPointsQuery, buildPhaseRankingQuery, type PageOptions } from "./queries";
import { fetchSchemaFields } from "./schema";
import type { AnalyticsFilters, DashboardSnapshot, DataScienceAircraftRateRow, DataScienceDistributionRow, DatasetManifest, EventRow, FilterOptions, PagedEvents, SqlQuery } from "./types";


function plainValue(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}


function tableRows(table: { toArray(): unknown[] }): Record<string, unknown>[] {
  return table.toArray().map((row) => {
    const source = row as Record<string, unknown>;
    return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, plainValue(value)]));
  });
}


export class RequestTokenRegistry {
  private readonly tokens = new Map<string, number>();

  next(channel: string): number {
    const token = (this.tokens.get(channel) ?? 0) + 1;
    this.tokens.set(channel, token);
    return token;
  }

  isCurrent(channel: string, token: number): boolean {
    return this.tokens.get(channel) === token;
  }
}


export class StaticDataService {
  private manifestPromise: Promise<DatasetManifest> | null = null;
  private schemaFieldsPromise: Promise<string[]> | null = null;
  private readonly requestTokens = new RequestTokenRegistry();
  private readonly registered = new Set<string>();

  constructor(private readonly basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "") {}

  manifest(signal?: AbortSignal): Promise<DatasetManifest> {
    this.manifestPromise ??= fetchManifest(this.basePath, signal).catch((error) => {
      this.manifestPromise = null;
      throw error;
    });
    return this.manifestPromise;
  }

  schemaFields(signal?: AbortSignal): Promise<string[]> {
    this.schemaFieldsPromise ??= fetchSchemaFields(this.basePath, signal).catch((error) => {
      this.schemaFieldsPromise = null;
      throw error;
    });
    return this.schemaFieldsPromise;
  }

  private async registerFile(name: string, path: string): Promise<void> {
    if (this.registered.has(name)) return;
    const { db } = await getDuckDbClient({ basePath: this.basePath });
    await db.registerFileURL(name, withBasePath(`/data/${path}`, this.basePath), duckdb.DuckDBDataProtocol.HTTP, false);
    this.registered.add(name);
  }

  private async prepareYears(filters: AnalyticsFilters): Promise<void> {
    const manifest = await this.manifest();
    const assets = getYearAssets(manifest, filters.yearStart, filters.yearEnd);
    await Promise.all(assets.map((asset) => this.registerFile(`events_${asset.year}.parquet`, asset.path)));
    const { db } = await getDuckDbClient({ basePath: this.basePath });
    const connection = await db.connect();
    try {
      const files = assets.map((asset) => `'events_${asset.year}.parquet'`).join(", ");
      await connection.query(`CREATE OR REPLACE VIEW selected_events AS SELECT * FROM read_parquet([${files}], hive_partitioning=false)`);
    } finally {
      await connection.close();
    }
  }

  private async execute(query: SqlQuery, channel: string, signal?: AbortSignal): Promise<Record<string, unknown>[]> {
    if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
    const token = this.requestTokens.next(channel);
    const { db } = await getDuckDbClient({ basePath: this.basePath });
    const connection = await db.connect();
    const abort = () => { void connection.cancelSent(); };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const statement = await connection.prepare(query.text);
      try {
        const table = await statement.query(...query.params);
        if (signal?.aborted || !this.requestTokens.isCurrent(channel, token)) throw new DOMException("Stale request", "AbortError");
        return tableRows(table);
      } finally {
        await statement.close();
      }
    } finally {
      signal?.removeEventListener("abort", abort);
      await connection.close();
    }
  }

  async dashboard(filters: AnalyticsFilters, signal?: AbortSignal): Promise<DashboardSnapshot> {
    await this.prepareYears(filters);
    const [totals, annualRows, phaseRows, countryRows, mapRows, recentRows] = await Promise.all([
      this.execute(buildDashboardQuery(filters), "dashboard-totals", signal),
      this.execute(buildAnnualTrendQuery(filters), "dashboard-annual", signal),
      this.execute(buildPhaseRankingQuery(filters), "dashboard-phases", signal),
      this.execute(buildCountryRankingQuery(filters), "dashboard-countries", signal),
      this.execute(buildMapPointsQuery(filters), "dashboard-map", signal),
      this.execute(buildEventsPageQuery(filters, { sortBy: "event_date", sortDirection: "desc", limit: 6, offset: 0 }), "dashboard-recent", signal),
    ]);
    const row = totals[0] ?? {};
    return {
      eventCount: Number(row.event_count ?? 0),
      fatalEventCount: Number(row.fatal_event_count ?? 0),
      fatalitiesTotal: Number(row.fatalities_total ?? 0),
      annual: annualRows.map((item) => ({ year: Number(item.event_year), events: Number(item.events), fatalEvents: Number(item.fatal_events) })),
      phases: phaseRows.map((item) => ({ phase: String(item.phase), events: Number(item.events) })),
      countries: countryRows.map((item) => ({ country: String(item.country), events: Number(item.events) })),
      mapPoints: mapRows.map((item) => ({ latitude: Number(item.latitude), longitude: Number(item.longitude), events: Number(item.events) })),
      recent: recentRows as EventRow[],
    };
  }

  async dataScience(filters: AnalyticsFilters, signal?: AbortSignal): Promise<DataScienceDistributionRow[]> {
    await this.prepareYears(filters);
    const rows = await this.execute(buildDataScienceDistributionQuery(filters), "data-science-distributions", signal);
    return rows.map((row) => ({
      fieldKey: String(row.field_key),
      value: String(row.value),
      fatal: Number(row.fatal ?? 0),
      nonFatal: Number(row.non_fatal ?? 0),
      total: Number(row.total ?? 0),
      distinctValues: Number(row.distinct_values ?? 0),
    }));
  }

  async dataScienceAircraftRates(filters: AnalyticsFilters, signal?: AbortSignal): Promise<DataScienceAircraftRateRow[]> {
    await this.prepareYears(filters);
    const rows = await this.execute(buildDataScienceAircraftRateQuery(filters), "data-science-aircraft-rates", signal);
    return rows.map((row) => ({
      label: String(row.label),
      designation: String(row.designation),
      events: Number(row.events ?? 0),
      occupants: Number(row.occupants ?? 0),
      survivors: Number(row.survivors ?? 0),
    }));
  }

  async events(filters: AnalyticsFilters, page: PageOptions, signal?: AbortSignal): Promise<PagedEvents> {
    await this.prepareYears(filters);
    const rows = await this.execute(buildEventsPageQuery(filters, page), "events", signal) as EventRow[];
    return { rows, limit: page.limit, offset: page.offset };
  }

  async event(asnId: number, year: number, signal?: AbortSignal): Promise<EventRow | null> {
    await this.prepareYears({ yearStart: year, yearEnd: year, severity: "all" });
    return (await this.execute(buildEventLookupQuery(asnId), "event", signal))[0] as EventRow | undefined ?? null;
  }

  async filterOptions(signal?: AbortSignal): Promise<FilterOptions> {
    const manifest = await this.manifest(signal);
    const asset = manifest.summaries.find((item) => item.name === "filter_options");
    if (!asset) throw new Error("filter_options is missing from the validated manifest");
    await this.registerFile("filter_options.parquet", asset.path);
    const { db } = await getDuckDbClient({ basePath: this.basePath });
    const connection = await db.connect();
    try {
      await connection.query("CREATE OR REPLACE VIEW filter_options AS SELECT * FROM read_parquet('filter_options.parquet')");
    } finally {
      await connection.close();
    }
    const rows = await this.execute(buildFilterOptionsQuery(), "filters", signal);
    return { values: rows.map((row) => ({ dimension: String(row.dimension), value: String(row.value), eventCount: Number(row.event_count) })) };
  }
}


export const dataService = new StaticDataService();
