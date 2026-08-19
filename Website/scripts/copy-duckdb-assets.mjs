import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(websiteRoot, "node_modules", "@duckdb", "duckdb-wasm", "dist");
const targetRoot = path.join(websiteRoot, "public", "duckdb");
const assets = [
  "duckdb-mvp.wasm",
  "duckdb-browser-mvp.worker.js",
  "duckdb-eh.wasm",
  "duckdb-browser-eh.worker.js",
];

await mkdir(targetRoot, { recursive: true });
await Promise.all(assets.map((asset) => copyFile(path.join(sourceRoot, asset), path.join(targetRoot, asset))));
console.log(`Copied ${assets.length} DuckDB-Wasm assets to ${targetRoot}`);
