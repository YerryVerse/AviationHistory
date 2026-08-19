import { describe, expect, it } from "vitest";

import { RequestTokenRegistry } from "./dataService";


describe("RequestTokenRegistry", () => {
  it("allows independent dashboard and filter queries to remain current", () => {
    const tokens = new RequestTokenRegistry();
    const dashboard = tokens.next("dashboard");
    const filters = tokens.next("filters");
    expect(tokens.isCurrent("dashboard", dashboard)).toBe(true);
    expect(tokens.isCurrent("filters", filters)).toBe(true);
  });

  it("invalidates only an older request in the same channel", () => {
    const tokens = new RequestTokenRegistry();
    const first = tokens.next("events");
    const second = tokens.next("events");
    expect(tokens.isCurrent("events", first)).toBe(false);
    expect(tokens.isCurrent("events", second)).toBe(true);
  });
});
