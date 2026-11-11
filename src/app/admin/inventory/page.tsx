import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, Coins, PackageX } from "lucide-react";
import { InventoryTable, type InventoryRow } from "@/components/admin/inventory/inventory-table";
import { KpiCard } from "@/components/admin/kpi-card";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { daysAgo, formatCompact, stockStatus } from "@/lib/format";

export const metadata = { title: "Stock levels" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  const sp = await searchParams;
  const since = daysAgo(30);
  const [variants, categories, sales] = await Promise.all([
    db.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { createdAt: "asc" }],
      include: { product: { select: { id: true, name: true, price: true, status: true, category: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } }),
    db.inventoryMovement.groupBy({ by: ["variantId"], where: { type: "SALE", createdAt: { gte: since } }, _sum: { quantity: true } }),
  ]);
  const sold = new Map(sales.map((s) => [s.variantId, -(s._sum.quantity ?? 0)]));

  const rows: InventoryRow[] = variants.map((v) => {
    const velocity = (sold.get(v.id) ?? 0) / 30;
    return {
      id: v.id,
      productId: v.product.id,
      product: v.product.name,
      image: v.product.images[0]?.url ?? null,
      category: v.product.category.name,
      sku: v.sku,
      variant: [v.color, v.size].filter(Boolean).join(" / ") || "Default",
      colorHex: v.colorHex,
      bin: v.binLocation ?? "",
      stock: v.stock,
      reorderPoint: v.reorderPoint,
      reorderQty: v.reorderQty,
      status: stockStatus(v.stock, v.reorderPoint),
      cost: v.costPrice,
      value: v.stock * v.costPrice,
      sold30: sold.get(v.id) ?? 0,
      daysOfCover: velocity > 0 ? Math.round(v.stock / velocity) : null,
    };
  });

  const units = rows.reduce((s, r) => s + r.stock, 0);
  const value = rows.reduce((s, r) => s + r.value, 0);
  const low = rows.filter((r) => r.status === "low").length;
  const out = rows.filter((r) => r.status === "out" || r.status === "backorder").length;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  return (
    <>
      <PageHeader title="Stock levels" description="Real-time on-hand quantities for every SKU, with reorder signals and sales velocity.">
        <Button variant="outline" size="sm" asChild><Link href="/admin/inventory/movements">Movement history</Link></Button>
        <Button size="sm" asChild><Link href="/admin/purchase-orders/new?low=1"><ClipboardList /> Reorder low stock</Link></Button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Units on hand" value={units.toLocaleString()} hint={`${rows.length} SKUs`} icon={Boxes} />
        <KpiCard title="Stock value (cost)" value={`৳${formatCompact(value)}`} hint="Weighted by unit cost" icon={Coins} />
        <KpiCard title="Low stock" value={String(low)} hint="At or below reorder point" icon={AlertTriangle} tone="warning" />
        <KpiCard title="Out of stock" value={String(out)} hint="Incl. backordered pre-orders" icon={PackageX} tone="danger" />
      </div>
      <InventoryTable
        data={rows}
        categories={categories.map((c) => c.name)}
        initialSearch={typeof sp.q === "string" ? sp.q : ""}
        initialStatus={status === "low" ? ["low", "out", "backorder"] : status ? [status] : undefined}
      />
    </>
  );
}
