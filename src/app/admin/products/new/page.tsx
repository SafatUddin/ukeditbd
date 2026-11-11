import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/products/product-form";
import { db } from "@/lib/db";
import { getMediaLibrary } from "@/lib/queries/media";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, library] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }), getMediaLibrary()]);
  return (
    <>
      <PageHeader title="New product" description="Create a product and its sellable variants (size × colour)." />
      <ProductForm categories={categories} library={library} />
    </>
  );
}
