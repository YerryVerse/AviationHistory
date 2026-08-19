import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { verifyStaticExport } from "./verify-static-export.mjs";


async function fixture() {
  const out = await mkdtemp(path.join(os.tmpdir(), "aviation-static-"));
  await mkdir(path.join(out, "duckdb"), { recursive: true });
  await mkdir(path.join(out, "data", "events", "year=1902"), { recursive: true });
  await mkdir(path.join(out, "data", "summaries"), { recursive: true });
  const manifest = {
    analytical_field_count: 82,
    field_count: 86,
    years: [{ path: "events/year=1902/events.parquet" }],
    summaries: [{ path: "summaries/by_year.parquet" }],
    quality: { path: "quality.json", rows: 82 },
  };
  await Promise.all([
    writeFile(path.join(out, "index.html"), '<script src="/repo/_next/app.js"></script>', "utf8"),
    writeFile(path.join(out, "404.html"), "not found", "utf8"),
    writeFile(path.join(out, "data", "manifest.json"), JSON.stringify(manifest), "utf8"),
    writeFile(path.join(out, "data", "schema.json"), "{}", "utf8"),
    writeFile(path.join(out, "data", "validation.json"), "{}", "utf8"),
    writeFile(path.join(out, "data", "quality.json"), JSON.stringify({ columns: Array.from({ length: 82 }) }), "utf8"),
    writeFile(path.join(out, "data", "events", "year=1902", "events.parquet"), "p"),
    writeFile(path.join(out, "data", "summaries", "by_year.parquet"), "p"),
    ...["duckdb-mvp.wasm", "duckdb-eh.wasm", "duckdb-browser-mvp.worker.js", "duckdb-browser-eh.worker.js"].map((name) => writeFile(path.join(out, "duckdb", name), "x")),
  ]);
  await mkdir(path.join(out, "duckdb", "extensions", "v1.5.1", "wasm_mvp"), { recursive: true });
  await mkdir(path.join(out, "duckdb", "extensions", "v1.5.1", "wasm_eh"), { recursive: true });
  await writeFile(path.join(out, "duckdb", "extensions", "v1.5.1", "wasm_mvp", "parquet.duckdb_extension.wasm"), "x");
  await writeFile(path.join(out, "duckdb", "extensions", "v1.5.1", "wasm_eh", "parquet.duckdb_extension.wasm"), "x");
  return out;
}


test("accepts a complete static export with repository base-path references", async () => {
  const out = await fixture();
  const result = await verifyStaticExport(out, "/repo");
  assert.equal(result.assets, 3);
});


test("accepts a transformed export whose quality count matches the manifest", async () => {
  const out = await fixture();
  const manifestPath = path.join(out, "data", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.analytical_field_count = 81;
  manifest.field_count = 85;
  manifest.quality.rows = 81;
  await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
  await writeFile(path.join(out, "data", "quality.json"), JSON.stringify({ columns: Array.from({ length: 81 }) }), "utf8");
  const result = await verifyStaticExport(out, "/repo");
  assert.equal(result.assets, 3);
});


test("rejects missing manifest-listed assets", async () => {
  const out = await fixture();
  const manifestPath = path.join(out, "data", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.years = [{ path: "missing.parquet" }];
  manifest.summaries = [];
  await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
  await assert.rejects(() => verifyStaticExport(out, "/repo"), /missing\.parquet/);
});


test("rejects server and API artifacts", async () => {
  const out = await fixture();
  await mkdir(path.join(out, "api"));
  await assert.rejects(() => verifyStaticExport(out, "/repo"), /API artifact/);
});
