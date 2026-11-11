import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/components/logo";
import { FACEBOOK_URL } from "@/lib/brand";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  { title: "Shop", links: [["Beauty", "/shop?category=beauty"], ["Skincare", "/shop?category=skincare"], ["Fragrance", "/shop?category=fragrance"], ["Fashion", "/shop?category=fashion"], ["Shoes", "/shop?category=shoes"], ["Lifestyle", "/shop?category=lifestyle"], ["Food & Wellness", "/shop?category=food-wellness"]] },
  { title: "Client Care", links: [["My account", "/account"], ["Track an order", "/account/orders"], ["How pre-order works", "/#how-it-works"], ["Shipping & returns", "/#how-it-works"]] },
  { title: "The UK Edit", links: [["New arrivals", "/shop?sort=newest"], ["Pre-order drops", "/shop?preorder=1"], ["Sale", "/shop?sale=1"], ["Wishlist", "/account/wishlist"]] },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-navy text-white">
      <div className="h-1 bg-gradient-to-r from-gold via-rose to-gold" />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm space-y-6">
          <Link href="/" className="inline-block rounded-full bg-cream p-1 shadow-lg ring-1 ring-gold/60">
            <Image src="/brand/logo.png" alt={BRAND.name} width={112} height={112} className="size-28" />
          </Link>
          <p className="text-sm leading-relaxed text-white/70">
            {BRAND.tagline}. Authentic beauty, fragrance and fashion bought from trusted UK retailers and delivered to your door in Bangladesh.
          </p>
          <NewsletterForm />
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
              <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
            </svg>
            Follow us on Facebook
          </a>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="eyebrow mb-5 text-gold">{c.title}</p>
            <ul className="space-y-3">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/80 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 px-4 py-6 text-xs text-white/50 md:flex-row md:px-8">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="tracking-[0.2em] uppercase">{BRAND.promise.join(" · ")}</p>
          <p>Cash on Delivery · Visa · Mastercard · bKash (coming soon)</p>
        </div>
      </div>
    </footer>
  );
}
