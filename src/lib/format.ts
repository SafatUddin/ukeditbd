const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const formatPrice = (amount: number) => currency.format(amount);
export const formatCompact = (n: number) => compact.format(n);

export const formatDate = (d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) =>
  new Intl.DateTimeFormat("en-GB", opts).format(new Date(d));

export const formatDateTime = (d: Date | string) =>
  formatDate(d, { dateStyle: "medium", timeStyle: "short" });

export const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const variantLabel = (v: { size?: string | null; color?: string | null }) =>
  [v.color, v.size].filter(Boolean).join(" / ") || "Default";

export function stockStatus(stock: number, reorderPoint: number) {
  if (stock < 0) return "backorder" as const;
  if (stock === 0) return "out" as const;
  if (stock <= reorderPoint) return "low" as const;
  return "in" as const;
}
