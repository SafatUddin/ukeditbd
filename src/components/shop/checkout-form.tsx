"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, CreditCard, Loader2, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { placeOrder } from "@/lib/actions/shop";
import { cartSubtotal, shippingFor, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { PreorderTag } from "./preorder-tag";
import { cn } from "@/lib/utils";

type Defaults = { fullName: string; phone: string; line1: string; line2: string; area: string; city: string; postalCode: string };

export function CheckoutForm({ email, defaults, hasAddress }: { email: string; defaults: Defaults; hasAddress: boolean }) {
  const mounted = useMounted();
  const router = useRouter();
  const { items, clear } = useCart();
  const [method, setMethod] = useState<"COD" | "CARD">("COD");
  const [city, setCity] = useState(defaults.city);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!mounted) return <Skeleton className="mt-10 h-[600px] rounded-2xl" />;
  if (!items.length) {
    return (
      <div className="mt-10 flex flex-col items-center rounded-2xl bg-cream py-24 text-center">
        <p className="font-display text-3xl">Your bag is empty</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-8 py-3 text-sm text-white">Continue shopping</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal, city);
  const err = (k: string) => errors[k]?.[0];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setFormError(null);
    start(async () => {
      const res = await placeOrder({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        fullName: f.fullName,
        phone: f.phone,
        line1: f.line1,
        line2: f.line2,
        area: f.area,
        city: f.city,
        postalCode: f.postalCode,
        notes: f.notes,
        paymentMethod: method,
        cardNumber: f.cardNumber,
        cardExpiry: f.cardExpiry,
        cardCvc: f.cardCvc,
        saveAddress: f.saveAddress === "on",
      });
      if (res.ok) {
        clear();
        router.push(`/account/orders/${res.number}?placed=1`);
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-10">
        {formError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</p>}

        <Section step={1} title="Contact">
          <p className="text-sm text-muted-foreground">Order updates will be sent to <span className="text-foreground">{email}</span></p>
        </Section>

        <Section step={2} title="Delivery address">
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Full name" error={err("fullName")}><Input name="fullName" defaultValue={defaults.fullName} className="h-11" /></F>
            <F label="Phone" error={err("phone")}><Input name="phone" defaultValue={defaults.phone} placeholder="+880 17XX-XXXXXX" className="h-11" /></F>
            <F label="Street address" error={err("line1")} className="sm:col-span-2"><Input name="line1" defaultValue={defaults.line1} placeholder="House, road" className="h-11" /></F>
            <F label="Apartment, floor (optional)" className="sm:col-span-2"><Input name="line2" defaultValue={defaults.line2} className="h-11" /></F>
            <F label="Area" error={err("area")}><Input name="area" defaultValue={defaults.area} placeholder="Gulshan" className="h-11" /></F>
            <F label="City" error={err("city")}><Input name="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" /></F>
            <F label="Postal code (optional)"><Input name="postalCode" defaultValue={defaults.postalCode} className="h-11" /></F>
          </div>
          {!hasAddress && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox name="saveAddress" defaultChecked /> Save this address to my account
            </label>
          )}
        </Section>

        <Section step={3} title="Payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["COD", Banknote, "Cash on Delivery", "Pay in cash when your order arrives"],
              ["CARD", CreditCard, "Credit / Debit card", "Visa, Mastercard, Amex"],
            ] as const).map(([v, Icon, title, desc]) => (
              <button
                type="button"
                key={v}
                onClick={() => setMethod(v)}
                className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition", method === v ? "border-ink ring-1 ring-ink" : "hover:border-foreground/40")}
              >
                <Icon className="mt-0.5 size-5" strokeWidth={1.5} />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-xs text-muted-foreground">{desc}</span>
                </span>
              </button>
            ))}
          </div>
          {method === "CARD" && (
            <div className="mt-4 grid animate-in fade-in gap-4 rounded-xl bg-cream p-4 sm:grid-cols-4">
              <F label="Card number" error={err("cardNumber")} className="sm:col-span-2"><Input name="cardNumber" inputMode="numeric" placeholder="4242 4242 4242 4242" className="h-11 bg-white" /></F>
              <F label="Expiry" error={err("cardExpiry")}><Input name="cardExpiry" placeholder="MM/YY" className="h-11 bg-white" /></F>
              <F label="CVC" error={err("cardCvc")}><Input name="cardCvc" inputMode="numeric" placeholder="123" className="h-11 bg-white" /></F>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-4">
                <Lock className="size-3" /> Test mode — any valid-format card succeeds; cards ending in 0002 are declined.
              </p>
            </div>
          )}
        </Section>

        <Section step={4} title="Order notes">
          <Textarea name="notes" placeholder="Delivery instructions, gift message…" rows={3} />
        </Section>
      </div>

      <aside className="h-fit space-y-5 rounded-2xl bg-cream p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Summary</h2>
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3">
              <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image src={i.image} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" />
                <span className="absolute -top-0 -right-0 flex size-5 items-center justify-center rounded-bl-lg bg-ink text-[10px] text-white">{i.quantity}</span>
              </div>
              <div className="flex-1 text-sm">
                <p>{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.variantLabel}</p>
                {i.preorder && <PreorderTag days={i.preorderDays} />}
              </div>
              <p className="text-sm">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</span></div>
        </div>
        <div className="flex justify-between border-t pt-4 text-lg font-medium"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
        <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm text-white transition hover:bg-ink/85 disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {method === "COD" ? "Place order" : `Pay ${formatPrice(subtotal + shipping)}`}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3" /> Secure, encrypted checkout</p>
      </aside>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 text-lg font-medium">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function F({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
