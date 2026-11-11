import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/queries/catalog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, wished = false, priority = false }: { product: ProductCardData; wished?: boolean; priority?: boolean }) {
  const [primary, secondary] = product.images;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const sizes = product.variants.filter((v) => v.size && v.size !== "One Size");
  const isNew = product.tags.includes("new");
  const onSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const swatches = [...new Map(product.variants.filter((v) => v.colorHex).map((v) => [v.colorHex, v])).values()];

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt ?? product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={cn("object-contain p-6 mix-blend-multiply transition-all duration-700 ease-out group-hover:scale-[1.04]", secondary && "group-hover:opacity-0")}
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt=""
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-contain p-6 opacity-0 mix-blend-multiply transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.allowPreorder && product.variants.some((v) => v.stock <= 0) ? (
              <Badge className="bg-navy text-white">{totalStock <= 0 ? "Pre-order" : "Pre-order sizes"}</Badge>
            ) : totalStock <= 0 ? (
              <Badge className="bg-white text-foreground/60">Sold out</Badge>
            ) : onSale ? (
              <Badge className="bg-rose text-white">-{Math.round((1 - product.price / product.compareAtPrice!) * 100)}%</Badge>
            ) : isNew ? (
              <Badge className="bg-white text-foreground">New</Badge>
            ) : null}
          </div>
          {sizes.length > 0 && (totalStock > 0 || product.allowPreorder) && (
            <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-lg bg-white/90 p-2 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="mb-1 text-center text-[10px] tracking-wider text-muted-foreground uppercase">Available sizes</p>
              <div className="flex flex-wrap justify-center gap-1">
                {sizes.map((v) => (
                  <span key={v.size} className={cn("min-w-7 rounded px-1 text-center text-[11px]", v.stock <= 0 && !product.allowPreorder && "text-muted-foreground/40 line-through")}>
                    {v.size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>
      <WishlistButton productId={product.id} initial={wished} className="absolute top-3 right-3" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[10px] text-muted-foreground">{product.brand}</p>
          <Link href={`/product/${product.slug}`} className="mt-1 block truncate text-sm hover:underline">
            {product.name}
          </Link>
          {swatches.length > 0 && (
            <div className="mt-2 flex gap-1">
              {swatches.map((s) => (
                <span key={s.colorHex} title={s.color ?? ""} className="size-3 rounded-full ring-1 ring-black/10" style={{ background: s.colorHex! }} />
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className={cn("font-medium", onSale && "text-rose")}>
            {product.variants.some((v) => v.price && v.price !== product.price) && <span className="mr-1 text-[11px] font-normal text-muted-foreground">From</span>}
            {formatPrice(product.price)}
          </p>
          {onSale && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice!)}</p>}
        </div>
      </div>
    </div>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase shadow-sm", className)}>{children}</span>;
}

export function ProductGrid({ products, wishlist, className }: { products: ProductCardData[]; wishlist?: Set<string>; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} wished={wishlist?.has(p.id)} priority={i < 4} />
      ))}
    </div>
  );
}
