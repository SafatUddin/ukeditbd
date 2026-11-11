import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/shop/product-card";
import { ShopFilters, SortSelect } from "@/components/shop/shop-filters";
import { getSession } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getCategoriesWithCounts, getShopProducts, getWishlistIds } from "@/lib/queries/catalog";

export const metadata: Metadata = { title: "Shop" };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const arr = (v: string | string[] | undefined) => (v ? (Array.isArray(v) ? v : v.split(",")) : []);

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const filters = {
    q: str(sp.q),
    category: str(sp.category),
    gender: str(sp.gender),
    size: arr(sp.size),
    min: Number(str(sp.min)) || undefined,
    max: Number(str(sp.max)) || undefined,
    sort: str(sp.sort),
    sale: str(sp.sale) === "1",
    preorder: str(sp.preorder) === "1",
  };
  const session = await getSession();
  const [products, categories, sizeRows, wishlist] = await Promise.all([
    getShopProducts(filters),
    getCategoriesWithCounts(),
    db.productVariant.findMany({ distinct: ["size"], select: { size: true }, where: { size: { not: "One Size" } } }),
    getWishlistIds(session?.userId),
  ]);

  const category = categories.find((c) => c.slug === filters.category);
  const title = filters.q
    ? `Results for “${filters.q}”`
    : filters.sale
      ? "Sale"
      : filters.preorder
        ? "Pre-order from the UK"
      : category?.name ?? (filters.gender === "WOMEN" ? "Women" : filters.gender === "MEN" ? "Men" : "All products");
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizes = sizeRows
    .map((s) => s.size!)
    .filter(Boolean)
    .sort((a, b) => (order.includes(a) && order.includes(b) ? order.indexOf(a) - order.indexOf(b) : order.includes(a) ? -1 : order.includes(b) ? 1 : Number(a) - Number(b)));

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      <div className="border-b py-10">
        <nav className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link> / <span>Shop</span>
        </nav>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">{title}</h1>
        {category?.description && !filters.q && <p className="mt-3 max-w-xl text-muted-foreground">{category.description}</p>}
        {filters.preorder && <p className="mt-3 max-w-xl text-muted-foreground">Can&apos;t find it in stock? These pieces can be ordered now — we buy them from UK retailers and fly them to Bangladesh for you.</p>}
      </div>

      <div className="grid gap-10 py-8 lg:grid-cols-[240px_1fr]">
        <ShopFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))} sizes={sizes} />
        <div>
          <div className="mb-8 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{products.length} {products.length === 1 ? "piece" : "pieces"}</p>
            <SortSelect />
          </div>
          {products.length ? (
            <ProductGrid products={products} wishlist={wishlist} className="xl:grid-cols-3 2xl:grid-cols-4" />
          ) : (
            <div className="flex flex-col items-center rounded-2xl bg-cream py-24 text-center">
              <p className="font-display text-3xl">Nothing matches — yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
              <Link href="/shop" className="mt-6 rounded-full bg-ink px-6 py-3 text-sm text-white">Clear all filters</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
