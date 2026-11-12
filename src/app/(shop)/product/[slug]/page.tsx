import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductGrid } from "@/components/shop/product-card";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { getSession } from "@/lib/auth/dal";
import { getProductBySlug, getRelatedProducts, getWishlistIds } from "@/lib/queries/catalog";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await getSession();
  const [related, wishlist] = await Promise.all([getRelatedProducts(product.id, product.categoryId), getWishlistIds(session?.userId)]);
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      <nav className="py-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link> /{" "}
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link> /{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <ProductGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }))} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow text-muted-foreground">{product.brand} · {product.category.name}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <p className={`text-xl ${onSale ? "text-rose" : ""}`}>
              {product.variants.some((v) => v.price && v.price !== product.price) && <span className="mr-1 text-sm text-muted-foreground">From</span>}
              {formatPrice(product.price)}
            </p>
            {onSale && (
              <>
                <p className="text-muted-foreground line-through">{formatPrice(product.compareAtPrice!)}</p>
                <span className="rounded-full bg-rose/10 px-2 py-0.5 text-xs font-medium text-rose">
                  Save {formatPrice(product.compareAtPrice! - product.price)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of VAT. Or 3 interest-free payments with selected cards.</p>
          <p className="mt-6 leading-relaxed text-foreground/75">{product.description}</p>

          <ProductPurchase
            product={{ id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0]?.url ?? "", allowPreorder: product.allowPreorder, preorderDays: product.preorderDays }}
            variants={product.variants}
            wished={wishlist.has(product.id)}
          />

          <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
            {[
              { icon: Truck, t: "In-stock: 2–4 day delivery" },
              { icon: RotateCcw, t: "Free 14-day returns" },
              { icon: ShieldCheck, t: "100% authentic, UK-sourced" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex flex-col items-center gap-2 rounded-xl bg-cream p-3">
                <Icon className="size-4 text-foreground" strokeWidth={1.5} />
                {t}
              </div>
            ))}
          </div>

          <Accordion type="single" collapsible defaultValue="details" className="mt-8">
            <AccordionItem value="details">
              <AccordionTrigger>Details & composition</AccordionTrigger>
              <AccordionContent className="space-y-1 text-muted-foreground">
                <p>{product.material}</p>
                <p>Style code: {product.slug.toUpperCase().slice(0, 12)}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>Care</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{product.care}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping & returns</AccordionTrigger>
              <AccordionContent className="space-y-2 text-muted-foreground">
                <p>Dhaka: ৳80 · Outside Dhaka: ৳150.</p>
                <p>In-stock items ship from our Dhaka hub in 2–4 days. Pre-order items are bought from UK retailers and flown in, arriving in {product.preorderDays}–{product.preorderDays + 7} days.</p>
                <p>Returns accepted within 14 days in original, unopened condition. Beauty, skincare and fragrance must be sealed.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-10 font-display text-4xl">You may also like</h2>
          <ProductGrid products={related} wishlist={wishlist} />
        </section>
      )}
    </div>
  );
}
