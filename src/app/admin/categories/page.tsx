import Image from "next/image";
import Link from "next/link";
import { CategoryDialog, DeleteCategoryButton } from "@/components/admin/category-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatCompact } from "@/lib/format";
import { getMediaLibrary } from "@/lib/queries/media";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const [categories, library] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { products: { select: { status: true, variants: { select: { stock: true, costPrice: true } } } } },
    }),
    getMediaLibrary(),
  ]);

  return (
    <>
      <PageHeader title="Categories" description="Organise your catalog. Categories power storefront navigation and filters.">
        <CategoryDialog library={library} nextSort={categories.length} />
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((c) => {
          const active = c.products.filter((p) => p.status === "ACTIVE").length;
          const units = c.products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock, 0), 0);
          const value = c.products.reduce((s, p) => s + p.variants.reduce((a, v) => a + v.stock * v.costPrice, 0), 0);
          return (
            <Card key={c.id} className="group gap-0 overflow-hidden py-0">
              <div className="relative aspect-[16/10] bg-muted/40">
                {c.image && <Image src={c.image} alt={c.name} fill sizes="300px" className="object-contain p-6 transition-transform duration-500 group-hover:scale-105" />}
                <div className="absolute top-2 right-2 flex rounded-lg bg-background/80 backdrop-blur">
                  <CategoryDialog library={library} category={{ id: c.id, name: c.name, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder }} />
                  <DeleteCategoryButton id={c.id} name={c.name} />
                </div>
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <Link href={`/shop?category=${c.slug}`} target="_blank" className="font-semibold hover:underline">{c.name}</Link>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{c.description ?? "No description"}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-md bg-muted/50 py-2"><p className="text-base font-semibold tabular-nums">{active}<span className="text-xs text-muted-foreground">/{c.products.length}</span></p><p className="text-muted-foreground">Live</p></div>
                  <div className="rounded-md bg-muted/50 py-2"><p className="text-base font-semibold tabular-nums">{units}</p><p className="text-muted-foreground">Units</p></div>
                  <div className="rounded-md bg-muted/50 py-2"><p className="text-base font-semibold tabular-nums">৳{formatCompact(value)}</p><p className="text-muted-foreground">Value</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
