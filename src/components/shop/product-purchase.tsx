"use client";

import { useState } from "react";
import { Check, Plane, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { PREORDER_MAX_QTY, useCart } from "@/lib/cart-store";
import { formatPrice, variantLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QtyStepper } from "./cart-drawer";
import { WishlistButton } from "./wishlist-button";

type Variant = { id: string; size: string | null; color: string | null; colorHex: string | null; price: number | null; stock: number };
type Props = {
  product: { id: string; slug: string; name: string; price: number; image: string; allowPreorder: boolean; preorderDays: number };
  variants: Variant[];
  wished: boolean;
};

export function ProductPurchase({ product, variants, wished }: Props) {
  const colors = [...new Map(variants.map((v) => [v.color, v])).values()];
  const [color, setColor] = useState(colors[0]?.color ?? null);
  const forColor = variants.filter((v) => v.color === color);
  const single = forColor.length === 1;
  const [variantId, setVariantId] = useState<string | null>(single ? forColor[0].id : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);

  const variant = variants.find((v) => v.id === variantId);
  const allOut = variants.every((v) => v.stock <= 0) && !product.allowPreorder;
  const isPreorder = !!variant && variant.stock <= 0 && product.allowPreorder;
  const maxQty = variant ? (isPreorder ? PREORDER_MAX_QTY : variant.stock) : 1;
  const unavailable = (v: Variant) => v.stock <= 0 && !product.allowPreorder;
  const displayPrice = variant?.price ?? forColor.find((v) => v.price)?.price ?? product.price;

  const onAdd = () => {
    if (!variant) return toast.error("Please select a size");
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        variantLabel: variantLabel(variant),
        price: variant.price ?? product.price,
        maxStock: maxQty,
        preorder: isPreorder,
        preorderDays: product.preorderDays,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-8 space-y-6">
      {colors.length > 0 && colors[0].color && (
        <div>
          <p className="text-sm">
            Colour: <span className="text-muted-foreground">{color}</span>
          </p>
          <div className="mt-3 flex gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setColor(c.color);
                  setVariantId(null);
                }}
                aria-label={c.color ?? ""}
                className={cn("size-9 rounded-full ring-offset-2 transition", c.color === color ? "ring-1 ring-ink" : "ring-1 ring-black/10")}
                style={{ background: c.colorHex ?? "#ddd" }}
              />
            ))}
          </div>
        </div>
      )}

      {!single && (
        <div>
          <div className="flex items-center justify-between text-sm">
            <p>
              Size: <span className="text-muted-foreground">{variant?.size ?? "Select"}</span>
            </p>
            <button className="text-xs text-muted-foreground underline underline-offset-4">Size guide</button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {forColor.map((v) => (
              <button
                key={v.id}
                disabled={unavailable(v)}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={cn(
                  "relative h-11 rounded-lg border text-sm transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground/40",
                  v.id === variantId ? "border-ink bg-ink text-white" : "hover:border-foreground",
                )}
              >
                {v.size}
                {unavailable(v) && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-muted-foreground/40" />}
                {v.stock <= 0 && product.allowPreorder && <span className="absolute -top-1.5 -right-1.5 size-3 rounded-full border-2 border-white bg-gold" title="Pre-order" />}
              </button>
            ))}
          </div>
          {forColor.some((v) => v.price) && <p className="mt-2 text-xs text-muted-foreground">Selected size: {formatPrice(displayPrice)}</p>}
        </div>
      )}

      {variant && variant.stock > 0 && variant.stock <= 5 && (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <span className="size-1.5 animate-pulse rounded-full bg-amber-600" /> Only {variant.stock} left in Dhaka — order soon
        </p>
      )}

      {(isPreorder || (!variant && product.allowPreorder && variants.some((v) => v.stock <= 0))) && (
        <div className="flex gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
          <Plane className="mt-0.5 size-4 shrink-0 text-gold" />
          <div>
            <p className="font-medium">{isPreorder ? "Available to pre-order" : "Some sizes available to pre-order"}</p>
            <p className="text-muted-foreground">
              We&apos;ll source it from the UK for you. Estimated delivery in {product.preorderDays}–{product.preorderDays + 7} days. Pay on delivery or by card today.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {variant && <QtyStepper value={qty} max={maxQty} onChange={setQty} />}
        <button
          onClick={onAdd}
          disabled={allOut || (variant && unavailable(variant))}
          className={cn(
            "flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm text-white transition disabled:bg-muted disabled:text-muted-foreground",
            isPreorder ? "bg-rose hover:bg-rose/90" : "bg-ink hover:bg-ink/85",
          )}
        >
          {added ? <Check className="size-4" /> : isPreorder ? <Plane className="size-4" /> : <ShoppingBag className="size-4" />}
          {allOut ? "Sold out" : added ? "Added to bag" : isPreorder ? "Pre-order now" : "Add to bag"}
        </button>
        <WishlistButton productId={product.id} initial={wished} withLabel />
      </div>
    </div>
  );
}
