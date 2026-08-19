import * as duckdb from "@duckdb/duckdb-wasm";
import type { DuckDBBundles } from "@duckdb/duckdb-wasm";

import { withBasePath } from "./basePath";


export interface DuckDbClient {
  db: duckdb.AsyncDuckDB;
  worker: Worker;
}

type ClientFactory = () => Promise<DuckDbClient>;

export interface DuckDbClientOptions {
  basePath?: string;
  factory?: ClientFactory;
  fetcher?: typeof fetch;
  verifyAssets?: boolean;
}


export function resolveDuckDbBundles(basePath = ""): DuckDBBundles {
  return {
    mvp: {
      mainModule: withBasePath("/duckdb/duckdb-mvp.wasm", basePath),
      mainWorker: withBasePath("/duckdb/duckdb-browser-mvp.worker.js", basePath),
    },
    eh: {
      mainModule: withBasePath("/duckdb/duckdb-eh.wasm", basePath),
      mainWorker: withBasePath("/duckdb/duckdb-browser-eh.worker.js", basePath),
    },
  };
}


export function extensionRepositoryUrl(origin: string, basePath = ""): string {
  return new URL(withBasePath("/duckdb/extensions", basePath), origin).href.replace(/\/$/, "");
}


export async function assertBundleAssets(
  bundles: DuckDBBundles,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const urls = [
    bundles.mvp.mainModule,
    bundles.mvp.mainWorker,
    bundles.eh?.mainModule,
    bundles.eh?.mainWorker,
  ].filter((value): value is string => Boolean(value));
  for (const url of urls) {
    const response = await fetcher(url, { method: "HEAD", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`DuckDB static asset is unavailable (${response.status}): ${url}`);
    }
  }
}


async function defaultFactory(basePath: string): Promise<DuckDbClient> {
  const bundle = await duckdb.selectBundle(resolveDuckDbBundles(basePath));
  if (!bundle.mainWorker) {
    throw new Error("DuckDB selected a bundle without a browser worker");
  }
  const worker = new Worker(bundle.mainWorker);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  try {
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    const connection = await db.connect();
    try {
      const repository = extensionRepositoryUrl(window.location.origin, basePath).replaceAll("'", "''");
      await connection.query(`SET custom_extension_repository = '${repository}'`);
    } finally {
      await connection.close();
    }
    return { db, worker };
  } catch (error) {
    worker.terminate();
    throw error;
  }
}


export async function createDuckDbClient(options: DuckDbClientOptions = {}): Promise<DuckDbClient> {
  const basePath = options.basePath ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const bundles = resolveDuckDbBundles(basePath);
  if (options.verifyAssets !== false) {
    await assertBundleAssets(bundles, options.fetcher);
  }
  return (options.factory ?? (() => defaultFactory(basePath)))();
}


let singleton: Promise<DuckDbClient> | null = null;


export function getDuckDbClient(options: DuckDbClientOptions = {}): Promise<DuckDbClient> {
  singleton ??= createDuckDbClient(options).catch((error) => {
    singleton = null;
    throw error;
  });
  return singleton;
}


export async function terminateDuckDbClient(): Promise<void> {
  const active = singleton;
  singleton = null;
  if (!active) return;
  const client = await active;
  await client.db.terminate();
}
