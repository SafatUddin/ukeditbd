import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_CONTACT } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping and UK pre-orders at The UK Edit BD.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <p className="eyebrow text-muted-foreground">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">Terms &amp; Conditions</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">1. About Us</h2>
          <p>
            Welcome to <strong>{BUSINESS_CONTACT.legalName}</strong>. We curate and import authentic beauty, skincare, fragrance, fashion, lifestyle, and wellness products from trusted UK retailers and deliver them across Bangladesh. By placing an order on our website, you agree to these Terms &amp; Conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">2. Pricing &amp; Currency</h2>
          <p>
            All product prices and delivery charges are listed in Bangladeshi Taka (BDT / ৳). Prices are subject to change without prior notice based on UK retail availability and exchange rates; however, once your order is confirmed, the confirmed order total will not change.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">3. Payment Terms (In-Stock &amp; Pre-Order)</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Pre-Order Items:</strong> Require a mandatory <strong>20% upfront advance</strong> via bKash Send Money (TrxID) or SSLCommerz (once live) to confirm sourcing from the UK. The remaining <strong>80%</strong> is payable via Cash on Delivery upon arrival. Cash on Delivery alone is not available for pre-order items.
            </li>
            <li>
              <strong>In-Stock Items:</strong> May be paid in full via bKash / SSLCommerz or via Cash on Delivery.
            </li>
            <li>
              <strong>Payment Verification:</strong> For manual bKash Send Money payments, orders are confirmed once our team verifies your submitted Transaction ID (TrxID).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">4. Delivery Timelines</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>In-Stock (Dhaka &amp; Nationwide):</strong> Estimated 2–4 working days after order confirmation.</li>
            <li><strong>UK Pre-Orders:</strong> Estimated 10–21 working days from order confirmation, depending on UK retailer dispatch, air cargo, and customs clearance.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">5. No Return, No Refund &amp; No Cancellation Policy</h2>
          <p>
            All sales and UK pre-orders are <strong>final</strong>. We do not offer returns, refunds, or order cancellations once an order has been placed and confirmed. Please review product details, sizes, and variants carefully before ordering. See our full{" "}
            <Link href="/refund-policy" className="font-medium text-navy underline underline-offset-4">
              Return, Refund &amp; Cancellation Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">6. Product Authenticity</h2>
          <p>
            Every item offered on {BUSINESS_CONTACT.legalName} is sourced directly from authorized UK retailers and brands. Packaging may occasionally vary slightly when brands update seasonal or regional designs.
          </p>
        </section>

        <section className="space-y-2 border-t pt-6">
          <h2 className="text-base font-semibold text-navy">7. Contact Information</h2>
          <p>{BUSINESS_CONTACT.legalName}</p>
          <p>Address: {BUSINESS_CONTACT.address}</p>
          <p>Phone: {BUSINESS_CONTACT.phone} · Email: {BUSINESS_CONTACT.email}</p>
          <p>Registration: {BUSINESS_CONTACT.dbid}</p>
        </section>
      </div>
    </div>
  );
}
