import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { requireUser } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/jwt";
import { db } from "@/lib/db";
import { isSslcommerzConfigured } from "@/lib/sslcommerz";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  if (isStaffRole(user.role)) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
        <p className="eyebrow text-muted-foreground">Storefront preview</p>
        <h1 className="mt-2 font-display text-5xl">Checkout unavailable</h1>
        <div className="mt-8 rounded-2xl border border-navy/15 bg-cream p-8">
          <div className="flex items-center gap-2.5 text-navy">
            <Shield className="size-5 text-gold" />
            <h2 className="font-medium">Admin accounts cannot place orders</h2>
          </div>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            You are signed in as an admin ({user.email}). Sign out and use a customer account if you want to test checkout.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin" className="inline-flex h-10 items-center rounded-full bg-navy px-6 text-sm text-white hover:bg-navy/90">
              Back to Admin
            </Link>
            <Link href="/shop" className="inline-flex h-10 items-center rounded-full border border-navy/20 px-6 text-sm text-navy hover:border-navy">
              Browse storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const address = await db.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <p className="eyebrow text-muted-foreground">Secure checkout</p>
      <h1 className="mt-2 font-display text-5xl">Checkout</h1>
      <CheckoutForm
        email={user.email}
        defaults={{
          fullName: address?.fullName ?? user.name,
          phone: address?.phone ?? user.phone ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          area: address?.area ?? "",
          city: address?.city ?? "Dhaka",
          postalCode: address?.postalCode ?? "",
        }}
        hasAddress={!!address}
        sslcommerzReady={isSslcommerzConfigured()}
        bkashNumber={process.env.NEXT_PUBLIC_BKASH_NUMBER || "[01XXX-XXXXXX]"}
      />
    </div>
  );
}
