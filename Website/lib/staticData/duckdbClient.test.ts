import { afterEach, describe, expect, it, vi } from "vitest";

import { withBasePath } from "./basePath";
import {
  assertBundleAssets,
  createDuckDbClient,
  extensionRepositoryUrl,
  getDuckDbClient,
  resolveDuckDbBundles,
  terminateDuckDbClient,
} from "./duckdbClient";


describe("withBasePath", () => {
  it("keeps local URLs rooted at the current origin", () => {
    expect(withBasePath("/data/manifest.json", "")).toBe("/data/manifest.json");
  });

  it("prefixes repository-scoped GitHub Pages URLs", () => {
    expect(withBasePath("data/manifest.json", "/Aviation-History/")).toBe(
      "/Aviation-History/data/manifest.json",
    );
  });
});


describe("DuckDB browser runtime", () => {
  afterEach(async () => {
    await terminateDuckDbClient();
  });

  it("uses only local MVP and exception-handling bundles", () => {
    expect(resolveDuckDbBundles("/repo")).toEqual({
      mvp: {
        mainModule: "/repo/duckdb/duckdb-mvp.wasm",
        mainWorker: "/repo/duckdb/duckdb-browser-mvp.worker.js",
      },
      eh: {
        mainModule: "/repo/duckdb/duckdb-eh.wasm",
        mainWorker: "/repo/duckdb/duckdb-browser-eh.worker.js",
      },
    });
  });

  it("points extension autoloading at the same-origin vendored repository", () => {
    expect(extensionRepositoryUrl("https://example.github.io", "/repo")).toBe(
      "https://example.github.io/repo/duckdb/extensions",
    );
  });

  it("reports a precise missing-asset error", async () => {
    const fetcher = vi.fn(async (url: string) => ({ ok: !url.endsWith(".wasm"), status: 404 })) as never;
    await expect(assertBundleAssets(resolveDuckDbBundles(""), fetcher)).rejects.toThrow(
      "/duckdb/duckdb-mvp.wasm",
    );
  });

  it("initializes once and terminates the worker", async () => {
    const terminate = vi.fn(async () => undefined);
    const factory = vi.fn(async () => ({ db: { terminate }, worker: { terminate: vi.fn() } })) as never;
    const first = getDuckDbClient({ factory, verifyAssets: false });
    const second = getDuckDbClient({ factory, verifyAssets: false });
    expect(first).toBe(second);
    await first;
    expect(factory).toHaveBeenCalledTimes(1);
    await terminateDuckDbClient();
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("creates a client through an injected runtime factory", async () => {
    const expected = { db: { terminate: vi.fn() }, worker: { terminate: vi.fn() } };
    const factory = vi.fn(async () => expected) as never;
    await expect(createDuckDbClient({ factory, verifyAssets: false })).resolves.toBe(expected);
  });
});
