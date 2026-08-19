"use client";

import { useCallback, useEffect, useState } from "react";

import { loadFlights, type YearlyFlightData } from "@/lib/staticData/flights";


export default function FlightsDashboard() {
  const [records, setRecords] = useState<YearlyFlightData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetryToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    loadFlights(process.env.NEXT_PUBLIC_BASE_PATH ?? "")
      .then((rows) => { if (active) setRecords(rows); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryToken]);

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">Loading static flight statistics…</div>;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">{error} <button onClick={retry} className="ml-3 rounded bg-rose-700 px-3 py-1 text-xs text-white">Retry</button></div>;
  const latest = records.at(-1);
  const peak = records.reduce<YearlyFlightData | null>((best, row) => !best || row.totalFlights > best.totalFlights ? row : best, null);
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase text-slate-400">Latest available</p><p className="mt-2 text-3xl font-black text-slate-900">{latest?.totalFlights.toLocaleString() ?? "—"}</p><p className="text-xs text-slate-500">{latest?.year}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase text-slate-400">Peak year</p><p className="mt-2 text-3xl font-black text-slate-900">{peak?.year ?? "—"}</p><p className="text-xs text-slate-500">{peak?.totalFlights.toLocaleString()} departures</p></article>
      </div>
      <div className="max-h-[32rem] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-white"><tr><th className="px-4 py-3">Year</th><th className="px-4 py-3 text-right">Flights</th><th className="px-4 py-3">Coverage</th><th className="px-4 py-3">Source</th></tr></thead><tbody>{records.toReversed().map((row) => <tr key={row.year} className="border-b border-slate-100"><td className="px-4 py-3 font-bold">{row.year}</td><td className="px-4 py-3 text-right">{row.totalFlights.toLocaleString()}</td><td className="px-4 py-3">{row.coverage.replaceAll("_", " ")}</td><td className="px-4 py-3"><a className="font-semibold text-blue-700 hover:underline" href={row.sourceUrl} target="_blank" rel="noreferrer">{row.source}</a></td></tr>)}</tbody></table>
      </div>
    </section>
  );
}
