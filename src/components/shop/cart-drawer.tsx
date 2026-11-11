"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cartCount, cartSubtotal, FREE_SHIPPING_THRESHOLD, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { PreorderTag } from "./preorder-tag";

export function CartDrawer() {
  const { items, open, setOpen, update, remove } = useCart();
  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className="border-b px-6 py-5">
          <SheetTitle className="font-display text-2xl font-medium">Your bag ({cartCount(items)})</SheetTitle>
          <SheetDescription className="sr-only">Items in your shopping bag</SheetDescription>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-cream">
              <ShoppingBag className="size-6" strokeWidth={1.5} />
            </div>
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="text-sm text-muted-foreground">Discover the season&apos;s most-wanted pieces.</p>
            <Button asChild className="mt-2 rounded-full px-8" onClick={() => setOpen(false)}>
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b bg-cream/60 px-6 py-4">
              <p className="text-xs">
                {remaining > 0 ? (
                  <>
                    You&apos;re <span className="font-semibold">{formatPrice(remaining)}</span> away from complimentary delivery
                  </>
                ) : (
                  <span className="font-medium">You&apos;ve unlocked complimentary delivery</span>
                )}
              </p>
              <Progress value={Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)} className="mt-2 h-1" />
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.variantId} className="flex gap-4 py-5">
                  <Link href={`/product/${i.slug}`} onClick={() => setOpen(false)} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg bg-cream">
                    <Image src={i.image} alt={i.name} fill sizes="96px" className="object-contain p-2 mix-blend-multiply" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{i.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{i.variantLabel}</p>
                        {i.preorder && <PreorderTag days={i.preorderDays} />}
                      </div>
                      <button onClick={() => remove(i.variantId)} aria-label="Remove" className="h-fit text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={i.quantity} max={i.maxStock} onChange={(q) => update(i.variantId, q)} />
                      <p className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
              <Button asChild className="h-12 w-full rounded-full" onClick={() => setOpen(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 w-full rounded-full" onClick={() => setOpen(false)}>
                <Link href="/cart">View bag</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex h-8 items-center rounded-full border">
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease" className="flex size-8 items-center justify-center disabled:opacity-30">
        <Minus className="size-3" />
      </button>
      <span className="w-6 text-center text-xs tabular-nums">{value}</span>
      <button onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase" className="flex size-8 items-center justify-center disabled:opacity-30">
        <Plus className="size-3" />
      </button>
    </div>
  );
}
