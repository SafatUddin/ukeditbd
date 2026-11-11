import { cn } from "@/lib/utils";

const tones = {
  gray: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300",
  blue: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
  indigo: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  green: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  red: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
  violet: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
} as const;

export type Tone = keyof typeof tones;

const map: Record<string, [string, Tone]> = {
  PENDING: ["Pending", "amber"],
  CONFIRMED: ["Confirmed", "blue"],
  PROCESSING: ["Processing", "indigo"],
  SHIPPED: ["Shipped", "violet"],
  DELIVERED: ["Delivered", "green"],
  CANCELLED: ["Cancelled", "red"],
  REFUNDED: ["Refunded", "gray"],
  UNPAID: ["Unpaid", "amber"],
  PAID: ["Paid", "green"],
  FAILED: ["Failed", "red"],
  DRAFT: ["Draft", "gray"],
  ACTIVE: ["Active", "green"],
  ARCHIVED: ["Archived", "gray"],
  ORDERED: ["Ordered", "blue"],
  PARTIAL: ["Partially received", "amber"],
  RECEIVED: ["Received", "green"],
  in: ["In stock", "green"],
  low: ["Low stock", "amber"],
  out: ["Out of stock", "red"],
  backorder: ["Backordered", "violet"],
  PREORDER: ["Pre-order", "violet"],
  INITIAL: ["Initial", "gray"],
  SALE: ["Sale", "blue"],
  RETURN: ["Return", "violet"],
  ADJUSTMENT: ["Adjustment", "indigo"],
  DAMAGE: ["Damage", "red"],
  ADMIN: ["Admin", "violet"],
  STAFF: ["Staff", "blue"],
  CUSTOMER: ["Customer", "gray"],
  COD: ["Cash on delivery", "gray"],
  CARD: ["Card", "indigo"],
};

export const statusLabel = (s: string) => map[s]?.[0] ?? s;

export function StatusBadge({ status, className, dot = true }: { status: string; className?: string; dot?: boolean }) {
  const [label, tone] = map[status] ?? [status, "gray" as Tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
