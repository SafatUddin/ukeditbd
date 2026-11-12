import { CartDrawer } from "@/components/shop/cart-drawer";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";

const messages = [
  "Curated from the UK · 100% authentic",
  "Pre-order anything — sourced from the UK for you",
  "Cash on Delivery available nationwide",
];

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <div className="overflow-hidden bg-navy py-2 text-[11px] tracking-[0.16em] text-white/90 uppercase">
        <div className="flex w-max animate-marquee gap-16">
          {[...messages, ...messages, ...messages, ...messages].map((m, i) => (
            <span key={i} className="whitespace-nowrap">
              {m}
            </span>
          ))}
        </div>
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
