import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/components/logo";
import { BUSINESS_CONTACT, FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/brand";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  { title: "Shop", links: [["Beauty", "/shop?category=beauty"], ["Skincare", "/shop?category=skincare"], ["Fragrance", "/shop?category=fragrance"], ["Fashion", "/shop?category=fashion"], ["Shoes", "/shop?category=shoes"], ["Lifestyle", "/shop?category=lifestyle"], ["Food & Wellness", "/shop?category=food-wellness"]] },
  { title: "Client Care", links: [["My account", "/account"], ["Track an order", "/account/orders"], ["How pre-order works", "/#how-it-works"], ["Terms & Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Return & Refund Policy", "/refund-policy"]] },
  { title: "The UK Edit", links: [["New arrivals", "/shop?sort=newest"], ["Pre-order drops", "/shop?preorder=1"], ["Wishlist", "/account/wishlist"]] },
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
          <div className="space-y-1 text-xs leading-relaxed text-white/60">
            <p className="font-medium text-white/80">Contact &amp; Business Details</p>
            <p>{BUSINESS_CONTACT.address}</p>
            <p>
              Phone:{" "}
              <a href={`tel:${BUSINESS_CONTACT.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-white">
                {BUSINESS_CONTACT.phone}
              </a>{" "}
              · Email:{" "}
              <a href={`mailto:${BUSINESS_CONTACT.email}`} className="hover:text-white">
                {BUSINESS_CONTACT.email}
              </a>
            </p>
            <p>{BUSINESS_CONTACT.dbid}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
              </svg>
              Facebook
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.39A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.12.66.67 1.33 1.09 2.12 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.39.67-.66 1.09-1.33 1.39-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.39-2.12A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
              </svg>
              Instagram
            </a>
          </div>
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
          <p>bKash Send Money · Cash on Delivery · SSLCommerz (bKash / Nagad / Cards — in progress)</p>
        </div>
      </div>
    </footer>
  );
}
