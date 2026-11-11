"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { cartSubtotal, FREE_SHIPPING_THRESHOLD, shippingFor, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { PreorderTag } from "./preorder-tag";
import { QtyStepper } from "./cart-drawer";

export function CartView() {
  const mounted = useMounted();
  const { items, update, remove } = useCart();
  if (!mounted) return <Skeleton className="mt-10 h-64 w-full rounded-2xl" />;

  if (!items.length) {
    return (
      <div className="mt-10 flex flex-col items-center rounded-2xl bg-cream py-24 text-center">
        <p className="font-display text-3xl">Your bag is empty</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-8 py-3 text-sm text-white">Continue shopping</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y border-y">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-6 py-6">
            <Link href={`/product/${i.slug}`} className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-cream md:w-36">
              <Image src={i.image} alt={i.name} fill sizes="144px" className="object-contain p-3 mix-blend-multiply" />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/product/${i.slug}`} className="font-medium hover:underline">{i.name}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{i.variantLabel}</p>
                  {i.preorder && <PreorderTag days={i.preorderDays} />}
                  <p className="mt-1 text-sm">{formatPrice(i.price)}</p>
                </div>
                <button onClick={() => remove(i.variantId)} aria-label="Remove" className="h-fit text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <QtyStepper value={i.quantity} max={i.maxStock} onChange={(q) => update(i.variantId, q)} />
                <p className="font-medium">{formatPrice(i.price * i.quantity)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit space-y-4 rounded-2xl bg-cream p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Order summary</h2>
        <Row label="Subtotal" value={formatPrice(subtotal)} />
        <Row label="Delivery (Dhaka)" value={shipping === 0 ? "Complimentary" : formatPrice(shipping)} />
        {subtotal < FREE_SHIPPING_THRESHOLD && (
          <p className="text-xs text-muted-foreground">Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for complimentary delivery.</p>
        )}
        <div className="border-t pt-4">
          <Row label="Estimated total" value={formatPrice(subtotal + shipping)} bold />
        </div>
        <Link href="/checkout" className="flex h-12 items-center justify-center rounded-full bg-ink text-sm text-white hover:bg-ink/85">
          Proceed to checkout
        </Link>
        <p className="text-center text-xs text-muted-foreground">Cash on Delivery & cards accepted</p>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "text-base font-medium" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
