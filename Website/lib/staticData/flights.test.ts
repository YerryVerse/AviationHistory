import { describe, expect, it, vi } from "vitest";

import { loadFlights } from "./flights";


describe("static flights loader", () => {
  it("loads and parses the same-origin base-path CSV", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      text: async () => "year,total_flights,coverage,status,source,source_url,notes\n2025,38000000,full_year,estimate,IATA,https://example.org,Annual estimate\n",
    })) as never;
    const rows = await loadFlights("/repo", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/repo/data/flights/global_annual_flights.csv", expect.anything());
    expect(rows[0]).toMatchObject({ year: 2025, totalFlights: 38_000_000, coverage: "full_year" });
  });

  it("surfaces failures and allows a later retry", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, text: async () => "year,total_flights,coverage,status,source,source_url,notes\n2024,1,full_year,actual,X,https://example.org,ok\n" }) as never;
    await expect(loadFlights("", fetcher)).rejects.toThrow("503");
    await expect(loadFlights("", fetcher)).resolves.toHaveLength(1);
  });
});
