import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";


const launcher = readFileSync(new URL("./start-website-production.ps1", import.meta.url), "utf8");


test("local website launcher owns the data transformation service", () => {
  assert.match(launcher, /scraper[\\/]src[\\/]server\.js/);
  assert.match(launcher, /data-admin-server\.out\.log/);
  assert.match(launcher, /api\/data-transformations\/schema/);
  assert.match(launcher, /Start-Process[\s\S]*\$TransformationServer/);
});


test("local website launcher reports both service URLs", () => {
  assert.match(launcher, /http:\/\/127\.0\.0\.1:\$TransformationPort/);
  assert.match(launcher, /Data transformation API/);
});
