// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { aviationTheme, resolveInitialColorScheme } from "./theme";


describe("aviation command theme", () => {
  afterEach(() => window.localStorage.clear());

  it("uses the persisted light or dark preference", () => {
    window.localStorage.setItem("aviation-color-scheme", "dark");
    expect(resolveInitialColorScheme()).toBe("dark");
    window.localStorage.setItem("aviation-color-scheme", "light");
    expect(resolveInitialColorScheme()).toBe("light");
  });

  it("falls back to automatic system preference", () => {
    window.localStorage.setItem("aviation-color-scheme", "invalid");
    expect(resolveInitialColorScheme()).toBe("auto");
  });

  it("defines Roboto and the approved teal palette", () => {
    expect(aviationTheme.fontFamily).toContain("Roboto");
    expect(aviationTheme.colors?.aviation?.[6]).toBe("#168b83");
    expect(aviationTheme.primaryColor).toBe("aviation");
  });
});
