import type { Metadata } from "next";
import { BUSINESS_CONTACT } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How The UK Edit BD collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-8">
      <p className="eyebrow text-muted-foreground">Legal</p>
      <h1 className="mt-2 font-display text-4xl text-navy md:text-5xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">1. Information We Collect</h2>
          <p>
            When you create an account or place an order with <strong>{BUSINESS_CONTACT.legalName}</strong>, we collect only the details needed to fulfil your order: your name, email address, phone number, delivery address, and payment reference (such as your bKash sender number / Transaction ID or SSLCommerz transaction reference).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">2. How We Use Your Information</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To process, verify, and deliver your in-stock and UK pre-order purchases.</li>
            <li>To communicate order status updates, pre-order arrival notifications, and courier delivery details.</li>
            <li>To prevent fraud and verify payment transactions.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">3. Payment Security</h2>
          <p>
            We never store your bKash PIN, mobile banking credentials, or debit/credit card numbers on our servers. Online card and mobile financial service payments processed through SSLCommerz are encrypted and handled directly on SSLCommerz&apos;s PCI-DSS compliant payment gateway.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-navy">4. Data Sharing</h2>
          <p>
            We do not sell or rent your personal data. We share necessary delivery details only with our courier partners in Bangladesh to complete your delivery, and payment transaction references with our payment gateway provider where required.
          </p>
        </section>

        <section className="space-y-2 border-t pt-6">
          <h2 className="text-base font-semibold text-navy">5. Contact Us</h2>
          <p>For privacy questions or account data requests, contact us at:</p>
          <p>{BUSINESS_CONTACT.legalName} · {BUSINESS_CONTACT.address}</p>
          <p>Phone: {BUSINESS_CONTACT.phone} · Email: {BUSINESS_CONTACT.email}</p>
        </section>
      </div>
    </div>
  );
}
