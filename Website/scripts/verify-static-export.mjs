import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


async function requireFile(filePath, label = filePath) {
  try {
    const info = await stat(filePath);
    if (!info.isFile() || info.size === 0) throw new Error("empty");
  } catch {
    throw new Error(`Static export is missing ${label}`);
  }
}


export async function verifyStaticExport(outDirectory, basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "") {
  const out = path.resolve(outDirectory);
  const required = [
    "index.html", "404.html", "data/manifest.json", "data/schema.json", "data/validation.json", "data/quality.json",
    "duckdb/duckdb-mvp.wasm", "duckdb/duckdb-eh.wasm",
    "duckdb/duckdb-browser-mvp.worker.js", "duckdb/duckdb-browser-eh.worker.js",
    "duckdb/extensions/v1.5.1/wasm_mvp/parquet.duckdb_extension.wasm",
    "duckdb/extensions/v1.5.1/wasm_eh/parquet.duckdb_extension.wasm",
  ];
  await Promise.all(required.map((relative) => requireFile(path.join(out, relative), relative)));
  const api = path.join(out, "api");
  try {
    await access(api);
    throw new Error(`Static export contains an API artifact: ${api}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Static export")) throw error;
  }
  const rootEntries = await readdir(out);
  if (rootEntries.some((name) => name === "server" || name === ".next")) {
    throw new Error("Static export contains server runtime artifacts");
  }
  const manifest = JSON.parse(await readFile(path.join(out, "data", "manifest.json"), "utf8"));
  if (!manifest.quality || manifest.quality.path !== "quality.json") throw new Error("Manifest is missing the quality asset");
  const analyticalFieldCount = manifest.analytical_field_count;
  if (!Number.isInteger(analyticalFieldCount) || analyticalFieldCount < 1 || analyticalFieldCount > 90) {
    throw new Error("Manifest analytical field count is invalid");
  }
  if (!Number.isInteger(manifest.field_count) || manifest.field_count < analyticalFieldCount) {
    throw new Error("Manifest field count is invalid");
  }
  if (manifest.quality.rows !== analyticalFieldCount) throw new Error("Manifest quality row count mismatch");
  const quality = JSON.parse(await readFile(path.join(out, "data", "quality.json"), "utf8"));
  if (!Array.isArray(quality.columns) || quality.columns.length !== analyticalFieldCount) {
    throw new Error(`Quality report must contain ${analyticalFieldCount} columns`);
  }
  const assets = [...(manifest.years ?? []), ...(manifest.summaries ?? []), manifest.quality];
  for (const asset of assets) {
    if (!asset || typeof asset.path !== "string") throw new Error("Manifest contains an invalid asset entry");
    await requireFile(path.join(out, "data", asset.path), asset.path);
  }
  const normalizedBase = basePath ? `/${basePath.replace(/^\/+|\/+$/g, "")}` : "";
  if (normalizedBase) {
    const index = await readFile(path.join(out, "index.html"), "utf8");
    if (!index.includes(`${normalizedBase}/_next/`)) {
      throw new Error(`index.html does not reference the configured base path ${normalizedBase}`);
    }
  }
  return { out, assets: assets.length };
}


const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await verifyStaticExport(process.argv[2] ?? path.join(websiteRoot, "out"), process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  console.log(`Verified static export: ${result.assets} manifest-listed dataset assets`);
}
