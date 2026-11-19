import type { Metadata } from "next";
import { BUSINESS_CONTACT } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Return, Refund & Cancellation Policy",
  description: "Return, refund, cancellation, and delivery policy for The UK Edit BD.",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <p className="eyebrow text-muted-foreground">Policies</p>
      <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">Return, Refund &amp; Cancellation Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-8 rounded-2xl border border-rose/25 bg-rose/5 p-5 text-sm text-navy">
        <p className="font-semibold">All Sales &amp; Pre-Orders Are Final</p>
        <p className="mt-1 text-foreground/80">
          Because our items are authentic cosmetics, skincare, fragrances, and personal products sourced specifically from UK retailers, <strong>we do not offer returns, refunds, or order cancellations</strong> once an order has been placed.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">1. No Returns</h2>
          <p>
            For hygiene, authenticity, and safety reasons, all beauty, skincare, fragrance, fashion, watch, and wellness products sold by {BUSINESS_CONTACT.legalName} are strictly non-returnable after delivery. Please check all product specifications, shades, sizes, and variants carefully before confirming your order.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">2. No Refunds</h2>
          <p>
            All completed payments — including the <strong>20% upfront bKash / SSLCommerz advance</strong> on UK pre-orders and full payments on in-stock orders — are strictly non-refundable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">3. No Cancellations</h2>
          <p>
            Once an order is submitted and confirmed, it cannot be cancelled or modified, as UK pre-order items are sourced immediately on your behalf.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">4. Delivery Timelines</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>In-Stock Items:</strong> 2–4 working days inside Dhaka and nationwide via courier.</li>
            <li><strong>UK Pre-Order Items:</strong> 10–21 working days from confirmation of the 20% upfront advance.</li>
          </ul>
        </section>

        <section className="space-y-2 border-t pt-6">
          <h2 className="text-base font-semibold text-navy">5. Need Help Before Ordering?</h2>
          <p>
            If you have any questions about sizing, shades, or delivery before placing your order, please reach out to us first:
          </p>
          <p>{BUSINESS_CONTACT.legalName} · {BUSINESS_CONTACT.address}</p>
          <p>Phone: {BUSINESS_CONTACT.phone} · Email: {BUSINESS_CONTACT.email}</p>
          <p>Support hours: {BUSINESS_CONTACT.hours}</p>
        </section>
      </div>
    </div>
  );
}
