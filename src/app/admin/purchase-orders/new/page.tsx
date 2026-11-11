import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { PurchaseOrderForm } from "@/components/admin/purchasing/purchase-order-form";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata = { title: "New purchase order" };

export default async function NewPurchaseOrderPage({ searchParams }: PageProps<"/admin/purchase-orders/new">) {
  const sp = await searchParams;
  const [suppliers, variants] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, leadTimeDays: true } }),
    db.productVariant.findMany({
      orderBy: { product: { name: "asc" } },
      select: { id: true, sku: true, size: true, color: true, stock: true, reorderPoint: true, reorderQty: true, costPrice: true, product: { select: { name: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } },
    }),
  ]);

  const options = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.product.name,
    label: [v.color, v.size].filter(Boolean).join(" / "),
    image: v.product.images[0]?.url ?? null,
    stock: v.stock,
    reorderPoint: v.reorderPoint,
    reorderQty: v.reorderQty,
    cost: v.costPrice,
  }));

  const preselect = typeof sp.variants === "string" ? new Set(sp.variants.split(",")) : null;
  const initialLines = options
    .filter((o) => (preselect ? preselect.has(o.id) : sp.low === "1" && o.stock <= o.reorderPoint))
    .map((o) => ({ variantId: o.id, quantity: Math.max(o.reorderQty, o.reorderPoint * 2 - o.stock), unitCost: o.cost }));

  if (!suppliers.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Add a supplier first</p>
        <p className="mt-1 text-sm text-muted-foreground">Purchase orders are raised against a supplier.</p>
        <Button className="mt-4" asChild><Link href="/admin/suppliers">Manage suppliers</Link></Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="New purchase order" description={initialLines.length ? `Pre-filled with ${initialLines.length} SKU(s) that need replenishing.` : "Select a supplier and the SKUs you want to reorder."} />
      <PurchaseOrderForm suppliers={suppliers} variants={options} initialLines={initialLines} />
    </>
  );
}
