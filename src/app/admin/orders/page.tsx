import { OrdersTable, type OrderRow } from "@/components/admin/orders/orders-table";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } }, items: { select: { quantity: true } } },
  });
  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    createdAt: o.createdAt.toISOString(),
    customer: o.customerName,
    email: o.email,
    city: o.city,
    phone: o.phone,
    address: [o.line1, o.line2, o.area, o.city, o.postalCode].filter(Boolean).join(", "),
    items: o.items.reduce((s, i) => s + i.quantity, 0),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: o.total,
  }));

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const toFulfil = orders.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.status));
  const codOutstanding = orders.filter((o) => o.paymentMethod === "COD" && o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader title="Orders" description={`${orders.length} orders · ${toFulfil.length} awaiting fulfilment`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Pending", count("PENDING"), "text-amber-600"],
          ["Confirmed", count("CONFIRMED"), "text-blue-600"],
          ["Processing", count("PROCESSING"), "text-indigo-600"],
          ["Shipped", count("SHIPPED"), "text-violet-600"],
          ["COD outstanding", formatPrice(codOutstanding), ""],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <OrdersTable data={rows} initialSearch={typeof sp.q === "string" ? sp.q : ""} initialStatus={typeof sp.status === "string" ? sp.status.split(",") : undefined} />
    </>
  );
}
