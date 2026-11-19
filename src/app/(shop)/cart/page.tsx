import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import { CartView } from "@/components/shop/cart-view";
import { getCurrentUser } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/jwt";

export const metadata: Metadata = { title: "Your bag" };

export default async function CartPage() {
  const user = await getCurrentUser();
  const isAdmin = !!user && isStaffRole(user.role);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Your bag</h1>
      {isAdmin ? (
        <div className="mt-8 rounded-2xl border border-navy/15 bg-cream p-8">
          <div className="flex items-center gap-2.5 text-navy">
            <Shield className="size-5 text-gold" />
            <h2 className="font-medium">Admin preview mode</h2>
          </div>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Admin accounts can browse the storefront to inspect products, but adding items to the bag and placing orders are disabled. Sign in with a customer account to test shopping.
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
      ) : (
        <CartView />
      )}
    </div>
  );
}
