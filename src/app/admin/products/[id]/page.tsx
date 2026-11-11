import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/products/product-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getMediaLibrary } from "@/lib/queries/media";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, categories, library] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { createdAt: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getMediaLibrary(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader title={product.name} description={`Last updated ${product.updatedAt.toLocaleString("en-GB")}`}>
        <StatusBadge status={product.status} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/product/${product.slug}`} target="_blank"><ExternalLink /> View in store</Link>
        </Button>
      </PageHeader>
      <ProductForm
        categories={categories}
        library={library}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          gender: product.gender as "MEN" | "WOMEN" | "UNISEX",
          status: product.status,
          featured: product.featured,
          allowPreorder: product.allowPreorder,
          preorderDays: product.preorderDays,
          brand: product.brand,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          material: product.material,
          care: product.care,
          tags: product.tags,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            costPrice: v.costPrice,
            stock: v.stock,
            reorderPoint: v.reorderPoint,
            binLocation: v.binLocation,
          })),
        }}
      />
    </>
  );
}
