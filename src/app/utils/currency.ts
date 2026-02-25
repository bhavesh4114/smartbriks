export function formatINR(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatINRNumber(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(safe);
}

export function parseCurrencyTextToNumber(value: string): number {
  const cleaned = (value || "").replace(/[₹$,]/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}
