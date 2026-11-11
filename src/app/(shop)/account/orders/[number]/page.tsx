import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PreorderTag } from "@/components/shop/preorder-tag";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const stepLabel = { PENDING: "Placed", CONFIRMED: "Confirmed", PROCESSING: "Packed", SHIPPED: "Shipped", DELIVERED: "Delivered" };

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/account/orders/[number]">) {
  const { number } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/account/orders/${number}`);
  const order = await db.order.findFirst({
    where: { number, userId: user.id },
    include: { items: { include: { variant: { select: { product: { select: { slug: true } } } } } }, events: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const current = steps.indexOf(order.status as (typeof steps)[number]);
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="space-y-8">
      {placed && (
        <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 p-6 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="font-display text-2xl">Thank you — your order is confirmed.</p>
            <p className="mt-1 text-sm text-emerald-800">We&apos;ve received order {order.number}. You&apos;ll receive updates as it makes its way to you.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">← All orders</Link>
          <h2 className="mt-2 font-display text-3xl">Order {order.number}</h2>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {!cancelled && (
        <div className="rounded-2xl border p-6">
          <ol className="grid grid-cols-5">
            {steps.map((s, i) => (
              <li key={s} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={cn("absolute top-3 right-1/2 h-0.5 w-full", i <= current ? "bg-ink" : "bg-border")} />}
                <span className={cn("relative z-10 flex size-6 items-center justify-center rounded-full border-2 text-[10px]", i <= current ? "border-ink bg-ink text-white" : "border-border bg-white")}>
                  {i <= current ? "✓" : i + 1}
                </span>
                <span className={cn("mt-2 text-xs", i <= current ? "font-medium" : "text-muted-foreground")}>{stepLabel[s]}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="divide-y rounded-2xl border">
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-4 p-5">
              <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                {i.image && <Image src={i.image} alt={i.productName} fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />}
              </div>
              <div className="flex-1">
                {i.variant ? <Link href={`/product/${i.variant.product.slug}`} className="font-medium hover:underline">{i.productName}</Link> : <p className="font-medium">{i.productName}</p>}
                <p className="text-sm text-muted-foreground">{i.variantLabel}</p>
                {i.preorder && <PreorderTag />}
                <p className="text-sm text-muted-foreground">Qty {i.quantity} × {formatPrice(i.unitPrice)}</p>
              </div>
              <p className="font-medium">{formatPrice(i.unitPrice * i.quantity)}</p>
            </div>
          ))}
          <div className="space-y-2 p-5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.shippingFee ? formatPrice(order.shippingFee) : "Complimentary"}</span></div>
            <div className="flex justify-between pt-2 text-base font-medium"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-cream p-5 text-sm">
            <p className="eyebrow mb-3 text-muted-foreground">Delivery to</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-muted-foreground">{order.line1}{order.line2 ? `, ${order.line2}` : ""}</p>
            <p className="text-muted-foreground">{order.area}, {order.city} {order.postalCode}</p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="eyebrow mt-5 mb-2 text-muted-foreground">Payment</p>
            <p>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Card"}</p>
          </div>
          <div className="rounded-2xl border p-5">
            <p className="eyebrow mb-4 text-muted-foreground">Activity</p>
            <ol className="space-y-4 border-l pl-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-ink" />
                  <p>{e.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
