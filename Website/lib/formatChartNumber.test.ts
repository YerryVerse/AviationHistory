import { describe, expect, it } from "vitest";

import { formatChartNumber } from "./formatChartNumber";

describe("formatChartNumber", () => {
  it("adds comma thousands separators", () => {
    expect(formatChartNumber(142100)).toBe("142,100");
  });

  it("preserves decimal precision", () => {
    expect(formatChartNumber(1234.5)).toBe("1,234.5");
  });
});
