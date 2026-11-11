import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { productCardInclude } from "@/lib/queries/catalog";

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: { include: productCardInclude } },
  });
  const products = items.map((i) => i.product);

  if (!products.length) {
    return (
      <div className="rounded-2xl bg-cream p-16 text-center">
        <p className="font-display text-3xl">Your wishlist is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any piece to save it for later.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-8 py-3 text-sm text-white">Discover pieces</Link>
      </div>
    );
  }
  return <ProductGrid products={products} wishlist={new Set(products.map((p) => p.id))} className="xl:grid-cols-3" />;
}
