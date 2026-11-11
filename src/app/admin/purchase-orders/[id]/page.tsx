import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { POActions } from "@/components/admin/purchasing/po-actions";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export default async function PurchaseOrderPage({ params }: PageProps<"/admin/purchase-orders/[id]">) {
  const { id } = await params;
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { variant: { select: { sku: true, size: true, color: true, stock: true, product: { select: { name: true, images: { take: 1, orderBy: { position: "asc" }, select: { url: true } } } } } } } },
    },
  });
  if (!po) notFound();

  const units = po.items.reduce((s, i) => s + i.quantity, 0);
  const received = po.items.reduce((s, i) => s + i.received, 0);
  const total = po.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return (
    <>
      <PageHeader title={po.number} description={`${po.supplier.name} · created ${formatDate(po.createdAt)}`}>
        <StatusBadge status={po.status} />
      </PageHeader>

      <POActions
        id={po.id}
        status={po.status}
        lines={po.items.map((i) => ({ itemId: i.id, sku: i.variant.sku, name: i.variant.product.name, label: [i.variant.color, i.variant.size].filter(Boolean).join(" / "), outstanding: i.quantity - i.received }))}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
          <CardContent className="px-0">
            <div className="divide-y border-y">
              {po.items.map((i) => (
                <div key={i.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md border bg-white">
                    {i.variant.product.images[0] && <Image src={i.variant.product.images[0].url} alt="" fill sizes="44px" className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.variant.product.name}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-mono">{i.variant.sku}</span> · {[i.variant.color, i.variant.size].filter(Boolean).join(" / ")} · {i.variant.stock} on hand</p>
                  </div>
                  <div className="w-32">
                    <p className="text-xs tabular-nums">{i.received} / {i.quantity} received</p>
                    <Progress value={(i.received / i.quantity) * 100} className="mt-1 h-1.5" />
                  </div>
                  <p className="w-20 text-right text-sm text-muted-foreground tabular-nums">@ {formatPrice(i.unitCost)}</p>
                  <p className="w-24 text-right font-medium tabular-nums">{formatPrice(i.quantity * i.unitCost)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-8 px-6 pt-4 text-sm">
              <span className="text-muted-foreground">{units} units</span>
              <span className="font-semibold">Total {formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span>{received} of {units} units</span><span className="font-medium">{Math.round((received / Math.max(units, 1)) * 100)}%</span></div>
              <Progress value={(received / Math.max(units, 1)) * 100} />
              <dl className="space-y-2 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Expected</dt><dd>{po.expectedAt ? formatDate(po.expectedAt) : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Received</dt><dd>{po.receivedAt ? formatDate(po.receivedAt) : "—"}</dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Supplier</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{po.supplier.name}</p>
              {po.supplier.contactName && <p className="text-muted-foreground">{po.supplier.contactName}</p>}
              {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
              {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
              <p className="pt-2 text-xs text-muted-foreground">Lead time: {po.supplier.leadTimeDays} days</p>
            </CardContent>
          </Card>
          {po.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{po.notes}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
