"use client";

import { ShoppingBag } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cartCount, useCart } from "@/lib/cart-store";

export function CartButton() {
  const mounted = useMounted();
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open bag"
      className="relative flex size-10 items-center justify-center rounded-full hover:bg-black/5"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
      {mounted && count > 0 && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-ink text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );
}
