import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Plane, RotateCcw, ShoppingBag, Truck, Wallet } from "lucide-react";
import { ProductGrid } from "@/components/shop/product-card";
import { getSession } from "@/lib/auth/dal";
import { toneFor } from "@/lib/brand";
import { getCategoriesWithCounts, getFeaturedProducts, getNewArrivals, getShopProducts, getWishlistIds } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();
  const [featured, arrivals, categories, wishlist, fragrances] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(4),
    getCategoriesWithCounts(),
    getWishlistIds(session?.userId),
    getShopProducts({ category: "fragrance", sort: "price-desc" }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative flex min-h-[540px] flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-cream p-8 md:p-14">
            <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full border-2 border-gold/40" />
            <div aria-hidden className="pointer-events-none absolute -top-28 -right-28 size-[400px] rounded-full border border-gold/20" />
            <p className="eyebrow flex animate-fade-up items-center gap-3 text-navy/70">
              <span className="h-px w-8 bg-gold" /> Curated from the UK <span className="h-px w-8 bg-gold" />
            </p>
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <h1 className="font-display text-[clamp(3.25rem,7.5vw,7rem)] leading-[0.92] font-medium text-navy">
                The best of
                <br />
                <em className="font-normal text-rose">Britain,</em> delivered.
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">
                Authentic beauty, skincare, fragrance and fashion — bought from trusted UK retailers and brought to your door anywhere in Bangladesh.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop?sort=newest" className="group inline-flex h-12 items-center gap-2 rounded-full bg-navy px-7 text-sm text-white transition hover:bg-navy/90">
                  Shop the edit <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/#how-it-works" className="inline-flex h-12 items-center gap-2 rounded-full border border-navy/20 px-7 text-sm text-navy transition hover:border-navy">
                  <Plane className="size-4" /> How pre-order works
                </Link>
              </div>
            </div>
            <p className="eyebrow relative text-[10px] text-navy/50">Shop <span className="text-gold">•</span> Pre-order <span className="text-gold">•</span> Deliver</p>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            <HeroTile slug="dior-jadore-edp" label="Fragrance" href="/shop?category=fragrance" tone="bg-pastel-lavender" className="row-span-2" priority />
            <HeroTile slug="eyeshadow-palette-with-mirror" label="Beauty" href="/shop?category=beauty" tone="bg-pastel-pink" />
            <HeroTile slug="cognac-hobo-bag" label="Fashion" href="/shop?category=fashion" tone="bg-pastel-peach" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto mt-6 max-w-[1440px] px-4 md:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "100% authentic", text: "Bought from UK retailers" },
            { icon: Plane, title: "Pre-order anything", text: "Sourced from the UK for you" },
            { icon: Wallet, title: "Cash on Delivery", text: "Pay when it arrives" },
            { icon: RotateCcw, title: "14-day returns", text: "Free & effortless" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 bg-white p-5">
              <Icon className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-navy">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <SectionHeading eyebrow="Explore" title="Shop by category" href="/shop" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-6 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0">
          {categories.map((c, i) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group relative w-36 shrink-0 snap-start md:w-auto">
              {i > 0 && <span aria-hidden className="absolute top-1/3 -left-3 hidden h-16 w-px bg-gold/50 md:block" />}
              <div className={cn("relative mx-auto aspect-square overflow-hidden rounded-full ring-1 ring-black/5 transition-shadow group-hover:shadow-lg", toneFor(c.slug))}>
                {c.image && <Image src={c.image} alt={c.name} fill sizes="200px" className="object-contain p-7 mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />}
              </div>
              <p className="eyebrow mt-4 text-center text-navy">{c.name}</p>
              <p className="mt-0.5 text-center text-xs text-muted-foreground">{c._count.products} pieces</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <SectionHeading eyebrow="Curated" title="Most wanted" href="/shop?sort=featured" />
        <ProductGrid products={featured} wishlist={wishlist} />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto mt-24 max-w-[1440px] scroll-mt-28 px-4 md:px-8">
        <div className="rounded-3xl border border-gold/30 bg-cream px-6 py-14 md:px-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-gold">How it works</p>
            <h2 className="mt-3 font-display text-4xl text-navy md:text-5xl">Shop · Pre-order · Deliver</h2>
            <p className="mt-4 text-muted-foreground">Can&apos;t find it in Dhaka? If it&apos;s sold in the UK, we can bring it to you — with clear timelines and no hidden fees.</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: ShoppingBag, title: "Shop in-stock", text: "Thousands of authentic UK products ready in our Dhaka hub. Delivered in 2–4 days." },
              { icon: Plane, title: "Pre-order from the UK", text: "Out of stock? Pre-order it. We buy from authorised UK retailers and fly it over in 10–21 days." },
              { icon: Truck, title: "Delivered to your door", text: "Nationwide delivery with Cash on Delivery. Free on orders over ৳10,000." },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
                <span className="absolute top-6 right-6 font-display text-5xl text-gold/30">0{i + 1}</span>
                <div className="flex size-12 items-center justify-center rounded-full bg-navy text-white">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>
                <p className="mt-6 text-lg font-medium text-navy">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Editorial — Fragrance */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <div className="grid overflow-hidden rounded-3xl bg-navy text-white lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 p-10 md:p-16">
            <p className="eyebrow text-gold">The Fragrance Edit</p>
            <h2 className="font-display text-5xl leading-[1] md:text-7xl">
              Signature scents,
              <br />
              <em className="text-pastel-pink">straight from London.</em>
            </h2>
            <p className="max-w-md text-white/70">
              Chanel, Dior, Gucci and more — 100% authentic, sourced from UK authorised retailers. Pre-order your favourite in 50ml or 100ml.
            </p>
            <Link href="/shop?category=fragrance" className="group inline-flex h-12 w-fit items-center gap-2 rounded-full bg-white px-7 text-sm text-navy">
              Discover fragrance <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3">
            {fragrances.slice(0, 2).map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/[0.06]">
                {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill sizes="25vw" className="object-contain p-8 transition-transform duration-700 group-hover:scale-105" />}
                <span className="absolute inset-x-3 bottom-3 rounded-xl bg-white/10 px-3 py-2 text-xs backdrop-blur">
                  <span className="block text-white/60">{p.brand}</span>
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto mt-24 max-w-[1440px] px-4 md:px-8">
        <SectionHeading eyebrow="Just landed from the UK" title="New arrivals" href="/shop?sort=newest" />
        <ProductGrid products={arrivals} wishlist={wishlist} />
      </section>
    </>
  );
}

function HeroTile({ slug, label, href, tone, className, priority }: { slug: string; label: string; href: string; tone: string; className?: string; priority?: boolean }) {
  return (
    <Link href={href} className={cn("group relative overflow-hidden rounded-3xl", tone, className)}>
      <Image src={`/products/${slug}/1.webp`} alt={label} fill priority={priority} sizes="25vw" className="object-contain p-8 mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
      <span className="eyebrow absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-[10px] text-navy backdrop-blur">{label} →</span>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl text-navy md:text-5xl">{title}</h2>
      </div>
      <Link href={href} className="group hidden items-center gap-1 text-sm text-navy underline-offset-4 hover:underline sm:flex">
        View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
