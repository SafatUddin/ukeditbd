import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsTable, type ProductRow } from "@/components/admin/products/products-table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } }, variants: { select: { stock: true, reorderPoint: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true } }),
  ]);

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
    category: p.category.name,
    status: p.status,
    featured: p.featured,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    variants: p.variants.length,
    stock: p.variants.reduce((s, v) => s + v.stock, 0),
    lowVariants: p.variants.filter((v) => v.stock <= v.reorderPoint).length,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <>
      <PageHeader title="Products" description={`${products.length} products in your catalog`}>
        <Button size="sm" asChild>
          <Link href="/admin/products/new"><Plus /> Add product</Link>
        </Button>
      </PageHeader>
      <ProductsTable data={rows} categories={categories.map((c) => c.name)} />
    </>
  );
}
