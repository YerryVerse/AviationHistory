// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

describe("Data Quality responsive layout", () => {
  it("uses a 50/50 desktop grid and stacks at 1180px", () => {
    expect(stylesheet).toMatch(
      /\.quality-workspace\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.quality-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });
});
