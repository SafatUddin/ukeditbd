"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/lib/actions/shop";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initial, className, withLabel }: { productId: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [wished, setWished] = useOptimistic(initial);

  const onClick = () =>
    startTransition(async () => {
      setWished(!wished);
      const res = await toggleWishlist(productId);
      if ("requiresAuth" in res) {
        toast("Sign in to save favourites", { action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(location.pathname)}`) } });
        return;
      }
      toast.success(res.wished ? "Saved to wishlist" : "Removed from wishlist");
      router.refresh();
    });

  if (withLabel) {
    return (
      <button onClick={onClick} className={cn("flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm transition-colors hover:border-foreground", className)}>
        <Heart className={cn("size-4", wished && "fill-red-600 text-red-600")} />
        {wished ? "Saved" : "Save"}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("flex size-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white", className)}
    >
      <Heart className={cn("size-4", wished && "fill-red-600 text-red-600")} strokeWidth={1.6} />
    </button>
  );
}
