"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, CreditCard, Loader2, Lock, Plane, Smartphone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMounted } from "@/hooks/use-mounted";
import { placeOrder } from "@/lib/actions/shop";
import { cartSubtotal, shippingFor, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { computePaymentAmounts, PREORDER_ADVANCE_PERCENT } from "@/lib/payment";
import { cn } from "@/lib/utils";
import { PreorderTag } from "./preorder-tag";

type Defaults = { fullName: string; phone: string; line1: string; line2: string; area: string; city: string; postalCode: string };
type Method = "COD" | "BKASH" | "SSLCOMMERZ";

export function CheckoutForm({
  email,
  defaults,
  hasAddress,
  sslcommerzReady,
  bkashNumber,
}: {
  email: string;
  defaults: Defaults;
  hasAddress: boolean;
  sslcommerzReady: boolean;
  bkashNumber: string;
}) {
  const mounted = useMounted();
  const router = useRouter();
  const { items, clear } = useCart();
  const hasPreorder = items.some((i) => i.preorder);
  const [method, setMethod] = useState<Method>(hasPreorder ? "BKASH" : "COD");
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
  const total = subtotal + shipping;
  const effectiveMethod: Method =
    hasPreorder && method === "COD"
      ? "BKASH"
      : !sslcommerzReady && method === "SSLCOMMERZ"
        ? "BKASH"
        : method;
  const { upfront, dueOnDelivery } = computePaymentAmounts(total, hasPreorder, effectiveMethod);
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
        paymentMethod: effectiveMethod,
        bkashSender: f.bkashSender,
        bkashTrxId: f.bkashTrxId,
        saveAddress: f.saveAddress === "on",
      });
      if (res.ok) {
        clear();
        if (res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          router.push(`/account/orders/${res.number}?placed=1`);
        }
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const options: { value: Method; icon: typeof Banknote; title: string; badge?: string; desc: string; disabled?: boolean }[] = [
    {
      value: "BKASH",
      icon: Smartphone,
      title: hasPreorder ? `bKash Send Money (${PREORDER_ADVANCE_PERCENT}% advance)` : "bKash Send Money (TrxID)",
      badge: "Active",
      desc: hasPreorder
        ? `Send ${formatPrice(upfront)} via bKash and enter your TrxID; pay the remaining ${formatPrice(dueOnDelivery)} on delivery`
        : "Send full amount via bKash and enter your Transaction ID (TrxID)",
    },
    {
      value: "SSLCOMMERZ",
      icon: CreditCard,
      title: hasPreorder ? `SSLCommerz — bKash / Nagad / Cards (${PREORDER_ADVANCE_PERCENT}% advance)` : "SSLCommerz (bKash / Nagad / Rocket / Cards)",
      badge: sslcommerzReady ? "Instant" : "In the works",
      desc: sslcommerzReady
        ? hasPreorder
          ? `Pay ${formatPrice(upfront)} instantly via SSLCommerz (bKash, Nagad, Rocket or Card); rest on delivery`
          : "Instant checkout with bKash, Nagad, Rocket, Visa, Mastercard & Amex"
        : "Automatic bKash & card checkout via SSLCommerz is currently in the works — please use bKash Send Money (TrxID) above for now.",
      disabled: !sslcommerzReady,
    },
    {
      value: "COD",
      icon: Banknote,
      title: "Cash on Delivery",
      desc: hasPreorder
        ? `Not available for pre-order items — requires ${PREORDER_ADVANCE_PERCENT}% upfront via bKash`
        : "Pay in cash when your in-stock order arrives",
      disabled: hasPreorder,
    },
  ];

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_420px]" noValidate>
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
          {hasPreorder && (
            <div className="mb-4 flex gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
              <Plane className="mt-0.5 size-4 shrink-0 text-gold" />
              <div>
                <p className="font-medium text-navy">{PREORDER_ADVANCE_PERCENT}% upfront payment required for pre-order items</p>
                <p className="text-muted-foreground">
                  Pay <strong>{formatPrice(upfront)}</strong> now via bKash to confirm UK sourcing. Pay the remaining{" "}
                  <strong>{formatPrice(dueOnDelivery)}</strong> in cash upon delivery.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {options.map(({ value, icon: Icon, title, badge, desc, disabled }) => (
              <button
                type="button"
                key={value}
                disabled={disabled}
                onClick={() => !disabled && setMethod(value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                  disabled
                    ? "cursor-not-allowed bg-muted/40 opacity-60"
                    : effectiveMethod === value
                      ? "border-ink ring-1 ring-ink"
                      : "hover:border-foreground/40",
                )}
              >
                <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {title}
                    {badge && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          badge === "In the works" ? "bg-amber-500/15 text-amber-800" : "bg-emerald-500/15 text-emerald-800",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>
                </span>
              </button>
            ))}
          </div>

          {effectiveMethod === "BKASH" && (
            <div className="mt-4 space-y-4 rounded-xl border border-rose/20 bg-cream p-5">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-navy">How to pay via bKash Send Money &amp; confirm your order</p>
                <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
                  <li>
                    Open your bKash app → tap <strong>Send Money</strong> → send to{" "}
                    <strong className="font-mono text-navy">{bkashNumber}</strong>
                  </li>
                  <li>
                    Send the exact amount: <strong className="text-rose">{formatPrice(upfront)}</strong>{" "}
                    {hasPreorder ? `(${PREORDER_ADVANCE_PERCENT}% pre-order advance)` : "(full order total)"}
                  </li>
                  <li>
                    On the bKash confirmation screen (or in the bKash SMS), copy your{" "}
                    <strong className="text-foreground">10-character Transaction ID (TrxID)</strong> (e.g.{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">BGH7K2M9PQ</code>).
                  </li>
                  <li>
                    <strong>Paste both below</strong> — the bKash mobile number you sent from and your TrxID — then submit your order. Our admin team will match your TrxID in bKash and confirm your order.
                  </li>
                </ol>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Your bKash number" error={err("bkashSender")}>
                  <Input name="bkashSender" defaultValue={defaults.phone} placeholder="017XXXXXXXX" className="h-11 bg-white" />
                </F>
                <F label="bKash Transaction ID (TrxID)" error={err("bkashTrxId")}>
                  <Input name="bkashTrxId" placeholder="e.g. BGH7K2M9PQ" className="h-11 bg-white font-mono uppercase" />
                </F>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Automatic bKash checkout through SSLCommerz is currently in the works. Our team verifies your TrxID promptly to confirm your order.
              </p>
            </div>
          )}

          {effectiveMethod === "SSLCOMMERZ" && sslcommerzReady && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3 shrink-0" /> You will be securely redirected to SSLCommerz to complete your payment.
            </p>
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
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(shipping)}</span></div>
        </div>
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-lg font-medium"><span>Total</span><span>{formatPrice(total)}</span></div>
          {hasPreorder && (
            <>
              <div className="flex justify-between text-sm font-medium text-rose">
                <span>Pay now ({PREORDER_ADVANCE_PERCENT}% advance)</span>
                <span>{formatPrice(upfront)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Due on delivery (80% COD)</span>
                <span>{formatPrice(dueOnDelivery)}</span>
              </div>
            </>
          )}
        </div>
        <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm text-white transition hover:bg-ink/85 disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {effectiveMethod === "COD"
            ? "Place order (Cash on Delivery)"
            : effectiveMethod === "BKASH"
              ? hasPreorder
                ? `Submit order (${formatPrice(upfront)} bKash TrxID)`
                : `Submit order (${formatPrice(total)} bKash TrxID)`
              : hasPreorder
                ? `Pay ${formatPrice(upfront)} (${PREORDER_ADVANCE_PERCENT}% via SSLCommerz)`
                : `Pay ${formatPrice(total)} via SSLCommerz`}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By placing an order, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link>,{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>, and{" "}
          <Link href="/refund-policy" className="underline underline-offset-2 hover:text-foreground">No Return / No Refund / No Cancellation Policy</Link>.
        </p>
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
