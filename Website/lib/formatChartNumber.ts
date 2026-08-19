const chartNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 20,
});

export function formatChartNumber(value: number) {
  return chartNumberFormatter.format(value);
}
