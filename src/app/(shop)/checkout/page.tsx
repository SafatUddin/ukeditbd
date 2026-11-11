import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
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
      />
    </div>
  );
}
