import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { OrderActions, OrderNoteForm } from "@/components/admin/orders/order-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice, initials } from "@/lib/format";
import type { OrderStatusValue } from "@/lib/order-flow";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { select: { stock: true, binLocation: true, product: { select: { id: true } } } } } },
      events: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, createdAt: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <PageHeader title={`Order ${order.number}`} description={`Placed ${formatDateTime(order.createdAt)} · ${order.paymentMethod === "COD" ? "Cash on delivery" : "Card payment"}`}>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
      </PageHeader>

      <OrderActions orderId={order.id} status={order.status as OrderStatusValue} canMarkPaid={order.paymentStatus === "UNPAID" && order.status !== "CANCELLED"} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</CardTitle></CardHeader>
            <CardContent className="px-0">
              <div className="divide-y border-y">
                {order.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-white">
                      {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain p-1" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {i.variant ? (
                        <Link href={`/admin/products/${i.variant.product.id}`} className="font-medium hover:underline">{i.productName}</Link>
                      ) : (
                        <p className="font-medium">{i.productName}</p>
                      )}
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        {i.variantLabel}
                        {i.preorder && <StatusBadge status="PREORDER" dot={false} />}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {i.sku}
                        {i.variant?.binLocation && <> · Bin {i.variant.binLocation}</>}
                        {i.variant && <> · {i.variant.stock} left</>}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground tabular-nums">{formatPrice(i.unitPrice)} × {i.quantity}</p>
                    <p className="w-24 text-right font-medium tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <dl className="ml-auto max-w-xs space-y-2 px-6 pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="tabular-nums">{formatPrice(order.shippingFee)}</dd></div>
                {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">-{formatPrice(order.discount)}</dd></div>}
                <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <OrderNoteForm orderId={order.id} />
              <ol className="relative space-y-5 border-l pl-6">
                {order.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-1 -left-[29px] flex size-3 items-center justify-center rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{e.message}</p>
                      {e.status && <StatusBadge status={e.status} dot={false} />}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}{e.actor && ` · ${e.actor}`}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-10"><AvatarFallback>{initials(order.customerName)}</AvatarFallback></Avatar>
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  {order.user && <p className="text-xs text-muted-foreground">{order.user._count.orders} orders · since {order.user.createdAt.getFullYear()}</p>}
                </div>
              </div>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="size-4" /> <a href={`mailto:${order.email}`} className="hover:text-foreground">{order.email}</a></p>
                <p className="flex items-center gap-2"><Phone className="size-4" /> <a href={`tel:${order.phone}`} className="hover:text-foreground">{order.phone}</a></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Shipping address</CardTitle></CardHeader>
            <CardContent className="flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-foreground">{order.customerName}</p>
                <p>{order.line1}</p>
                {order.line2 && <p>{order.line2}</p>}
                <p>{order.area}, {order.city} {order.postalCode}</p>
              </div>
            </CardContent>
          </Card>
          {order.notes && (
            <Card>
              <CardHeader><CardTitle>Customer note</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{order.notes}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
