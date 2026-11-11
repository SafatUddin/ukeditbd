import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PurchaseOrdersTable, type PORow } from "@/components/admin/purchasing/purchase-orders-table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata = { title: "Purchase orders" };

export default async function PurchaseOrdersPage() {
  const pos = await db.purchaseOrder.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: { select: { name: true } }, items: true } });
  const rows: PORow[] = pos.map((p) => {
    const units = p.items.reduce((s, i) => s + i.quantity, 0);
    return {
      id: p.id,
      number: p.number,
      supplier: p.supplier.name,
      status: p.status,
      lines: p.items.length,
      units,
      received: p.items.reduce((s, i) => s + i.received, 0),
      total: p.items.reduce((s, i) => s + i.quantity * i.unitCost, 0),
      expectedAt: p.expectedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    };
  });
  return (
    <>
      <PageHeader title="Purchase orders" description="Replenish stock from suppliers. Receiving a PO automatically updates inventory and unit cost.">
        <Button size="sm" asChild><Link href="/admin/purchase-orders/new"><Plus /> New purchase order</Link></Button>
      </PageHeader>
      <PurchaseOrdersTable data={rows} />
    </>
  );
}
