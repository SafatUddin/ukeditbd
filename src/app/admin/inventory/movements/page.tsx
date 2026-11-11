import { MovementsTable, type MovementRow } from "@/components/admin/inventory/movements-table";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";

export const metadata = { title: "Inventory movements" };

export default async function MovementsPage({ searchParams }: PageProps<"/admin/inventory/movements">) {
  const sp = await searchParams;
  const [movements, orders, pos] = await Promise.all([
    db.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      include: { user: { select: { name: true } }, variant: { select: { sku: true, size: true, color: true, product: { select: { id: true, name: true } } } } },
    }),
    db.order.findMany({ select: { id: true, number: true } }),
    db.purchaseOrder.findMany({ select: { id: true, number: true } }),
  ]);
  const refs = new Map([...orders.map((o) => [o.number, `/admin/orders/${o.id}`] as const), ...pos.map((p) => [p.number, `/admin/purchase-orders/${p.id}`] as const)]);

  const rows: MovementRow[] = movements.map((m) => ({
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    type: m.type,
    product: m.variant.product.name,
    productId: m.variant.product.id,
    sku: m.variant.sku,
    variant: [m.variant.color, m.variant.size].filter(Boolean).join(" / "),
    quantity: m.quantity,
    stockAfter: m.stockAfter,
    reference: m.reference ?? "",
    referenceHref: m.reference ? refs.get(m.reference) ?? null : null,
    reason: m.reason ?? "",
    user: m.user?.name ?? "System",
  }));

  return (
    <>
      <PageHeader title="Inventory movements" description="Immutable audit ledger of every stock change — sales, receipts, returns and adjustments." />
      <MovementsTable data={rows} initialSearch={typeof sp.q === "string" ? sp.q : ""} />
    </>
  );
}
