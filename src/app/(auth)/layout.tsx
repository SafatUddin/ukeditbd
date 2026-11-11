import Image from "next/image";
import { BRAND, Logo } from "@/components/logo";

const tiles = [
  { slug: "chanel-coco-noir-edp", tone: "bg-pastel-lavender" },
  { slug: "eyeshadow-palette-with-mirror", tone: "bg-pastel-pink" },
  { slug: "champagne-stiletto", tone: "bg-pastel-blue" },
  { slug: "olay-ultra-moisture-shea-butter-body-wash", tone: "bg-pastel-green" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <Logo className="h-16" priority />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </div>
      <div className="relative hidden overflow-hidden bg-cream lg:block">
        <div className="absolute inset-0 grid grid-cols-2 gap-3 p-3">
          {tiles.map((t) => (
            <div key={t.slug} className={`relative overflow-hidden rounded-2xl ${t.tone}`}>
              <Image src={`/products/${t.slug}/1.webp`} alt="" fill sizes="25vw" className="object-contain p-10 mix-blend-multiply" />
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream p-1.5 shadow-2xl ring-2 ring-gold/70">
          <Image src="/brand/logo.png" alt={BRAND.name} width={176} height={176} className="size-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent p-12 text-white">
          <p className="eyebrow text-gold">{BRAND.tagline}</p>
          <p className="mt-3 max-w-md font-display text-5xl leading-[1.05]">The best of Britain, delivered to Bangladesh.</p>
        </div>
      </div>
    </div>
  );
}
