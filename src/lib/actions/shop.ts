"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, getSession } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/jwt";
import { formatPrice, variantLabel } from "@/lib/format";
import { sendManualBkashAdminEmail } from "@/lib/mailer";
import { computePaymentAmounts, paymentMethodLabel } from "@/lib/payment";
import { shippingFor } from "@/lib/shipping";
import { initSslcommerzSession, isSslcommerzConfigured } from "@/lib/sslcommerz";
import { handleSslcommerzFailure } from "@/lib/sslcommerz-order";

export async function toggleWishlist(productId: string) {
  const session = await getSession();
  if (!session) return { requiresAuth: true as const };
  const key = { userId_productId: { userId: session.userId, productId } };
  const existing = await db.wishlistItem.findUnique({ where: key });
  if (existing) await db.wishlistItem.delete({ where: key });
  else await db.wishlistItem.create({ data: { userId: session.userId, productId } });
  revalidatePath("/account/wishlist");
  return { wished: !existing };
}

const checkoutSchema = z
  .object({
    items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1, "Your bag is empty"),
    fullName: z.string().trim().min(2, "Enter your full name"),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{10,16}$/, "Enter a valid phone number"),
    line1: z.string().trim().min(4, "Enter your street address"),
    line2: z.string().trim().optional(),
    area: z.string().trim().min(2, "Enter your area"),
    city: z.string().trim().min(2, "Enter your city"),
    postalCode: z.string().trim().optional(),
    notes: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(["COD", "BKASH", "SSLCOMMERZ"]),
    bkashSender: z.string().trim().optional(),
    bkashTrxId: z.string().trim().optional(),
    saveAddress: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "BKASH") return;
    if (!/^(\+?88)?01[3-9]\d{8}$/.test((v.bkashSender ?? "").replace(/[\s-]/g, ""))) {
      ctx.addIssue({ code: "custom", path: ["bkashSender"], message: "Enter a valid 11-digit bKash number (e.g. 017XXXXXXXX)" });
    }
    if (!/^[A-Za-z0-9]{6,20}$/.test((v.bkashTrxId ?? "").trim())) {
      ctx.addIssue({ code: "custom", path: ["bkashTrxId"], message: "Enter your bKash Transaction ID (TrxID)" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; number: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

class CheckoutError extends Error {}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to complete your purchase." };
  if (isStaffRole(user.role)) return { ok: false, error: "Admin accounts cannot place orders. Sign in with a customer account to shop." };
  const session = { userId: user.id, email: user.email, name: user.name };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please review the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const data = parsed.data;

  const isSslcommerz = data.paymentMethod === "SSLCOMMERZ";
  const isManualBkash = data.paymentMethod === "BKASH";
  if (isSslcommerz && !isSslcommerzConfigured()) {
    return {
      ok: false,
      error: "bKash & card payments via SSLCommerz are currently in the works. Please use bKash Send Money (TrxID) above.",
    };
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: data.items.map((i) => i.variantId) } },
        include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, category: { select: { name: true } } } } },
      });

      const lines = data.items.map((item) => {
        const v = variants.find((x) => x.id === item.variantId);
        if (!v || v.product.status !== "ACTIVE") throw new CheckoutError("An item in your bag is no longer available.");
        const preorder = v.stock < item.quantity && v.product.allowPreorder;
        if (v.stock < item.quantity && !preorder) throw new CheckoutError(`Only ${Math.max(0, v.stock)} left of ${v.product.name} (${variantLabel(v)}). Please update your bag.`);
        return { v, quantity: item.quantity, unitPrice: v.price ?? v.product.price, preorder };
      });
      const hasPreorder = lines.some((l) => l.preorder);
      if (hasPreorder && data.paymentMethod === "COD") {
        throw new CheckoutError("Pre-order items require a 20% upfront advance via bKash. Cash on Delivery is only available for in-stock items.");
      }

      const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const shippingFee = shippingFor(subtotal, data.city);
      const total = subtotal + shippingFee;
      const { upfront, dueOnDelivery } = computePaymentAmounts(total, hasPreorder, data.paymentMethod);

      const [{ max }] = await tx.$queryRaw<{ max: number | bigint | null }[]>`SELECT MAX(CAST(SUBSTR(number, 4) AS INTEGER)) AS max FROM "Order"`;
      const number = `UK-${Math.max(Number(max ?? 0), 1000) + 1}`;
      const gateway = isManualBkash ? "bKash Send Money (Manual)" : paymentMethodLabel(data.paymentMethod);
      const trxUpper = data.bkashTrxId?.trim().toUpperCase();
      const senderClean = data.bkashSender?.trim();
      const paymentRef = isManualBkash && trxUpper ? `TrxID: ${trxUpper} · From: ${senderClean}` : null;

      const order = await tx.order.create({
        data: {
          number,
          userId: session.userId,
          email: session.email,
          customerName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          area: data.area,
          city: data.city,
          postalCode: data.postalCode || null,
          notes: data.notes || null,
          paymentMethod: data.paymentMethod,
          paymentStatus: "UNPAID",
          paymentGateway: gateway,
          paymentRef,
          subtotal,
          shippingFee,
          total,
          paidAmount: 0,
          dueAmount: total,
          items: {
            create: lines.map(({ v, quantity, unitPrice, preorder }) => ({
              preorder,
              variantId: v.id,
              productName: v.product.name,
              variantLabel: variantLabel(v),
              sku: v.sku,
              image: v.product.images[0]?.url,
              unitPrice,
              unitCost: v.costPrice,
              quantity,
            })),
          },
          events: {
            create: [
              { status: "PENDING", message: "Order placed", actor: data.fullName },
              ...(isManualBkash
                ? [
                    {
                      message: hasPreorder
                        ? `bKash Send Money 20% advance (${formatPrice(upfront)}) submitted — ${paymentRef} (awaiting verification). Remaining ${formatPrice(dueOnDelivery)} due on delivery.`
                        : `bKash Send Money full payment (${formatPrice(total)}) submitted — ${paymentRef} (awaiting verification).`,
                      actor: data.fullName,
                    },
                  ]
                : hasPreorder
                  ? [{ message: `Pre-order requires 20% advance (${formatPrice(upfront)}) via ${gateway}; remaining ${formatPrice(dueOnDelivery)} due on delivery.`, actor: "System" }]
                  : []),
            ],
          },
        },
      });

      for (const { v, quantity, preorder } of lines) {
        // Pre-order lines may take stock negative: the deficit is backordered demand to source from the UK.
        const res = await tx.productVariant.updateMany({
          where: { id: v.id, ...(!preorder && { stock: { gte: quantity } }) },
          data: { stock: { decrement: quantity } },
        });
        if (res.count === 0) throw new CheckoutError(`${v.product.name} just sold out. Please update your bag.`);
        await tx.inventoryMovement.create({
          data: { variantId: v.id, type: "SALE", quantity: -quantity, stockAfter: v.stock - quantity, reason: preorder ? "Customer pre-order" : "Customer order", reference: order.number },
        });
      }

      if (data.saveAddress) {
        const count = await tx.address.count({ where: { userId: session.userId } });
        await tx.address.create({
          data: {
            userId: session.userId,
            fullName: data.fullName,
            phone: data.phone,
            line1: data.line1,
            line2: data.line2 || null,
            area: data.area,
            city: data.city,
            postalCode: data.postalCode || null,
            isDefault: count === 0,
          },
        });
      }

      const productNames = lines.map((l) => l.v.product.name).join(", ");
      const firstCategory = lines[0]?.v.product.category.name ?? "Retail";
      return {
        id: order.id,
        number,
        subtotal,
        shippingFee,
        total,
        upfront,
        dueOnDelivery,
        hasPreorder,
        trxUpper: trxUpper ?? "",
        senderClean: senderClean ?? "",
        items: lines.map(({ v, quantity, unitPrice, preorder }) => ({
          productName: v.product.name,
          variantLabel: variantLabel(v),
          quantity,
          unitPrice,
          preorder,
        })),
        productNames,
        firstCategory,
      };
    });

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;

    if (isManualBkash) {
      await sendManualBkashAdminEmail({
        orderId: created.id,
        orderNumber: created.number,
        customerName: data.fullName,
        customerPhone: data.phone,
        bkashSender: created.senderClean,
        bkashTrxId: created.trxUpper,
        items: created.items,
        subtotal: created.subtotal,
        shippingFee: created.shippingFee,
        total: created.total,
        expectedAdvance: created.upfront,
        dueOnDelivery: created.dueOnDelivery,
        hasPreorder: created.hasPreorder,
        adminOrderUrl: `${baseUrl}/admin/orders/${created.id}`,
      });
    }

    if (isSslcommerz) {
      const init = await initSslcommerzSession({
        tranId: created.number,
        amount: created.upfront,
        productName: created.productNames,
        productCategory: created.firstCategory,
        customerName: data.fullName,
        customerEmail: session.email,
        customerPhone: data.phone,
        customerAddress: [data.line1, data.area].filter(Boolean).join(", "),
        customerCity: data.city,
        customerPostcode: data.postalCode || "1212",
        preferBkash: false,
        baseUrl,
      });

      if (!init.ok) {
        await handleSslcommerzFailure(created.number, "failed");
        return { ok: false, error: init.error };
      }

      revalidatePath("/admin", "layout");
      revalidatePath("/account", "layout");
      return { ok: true, number: created.number, redirectUrl: init.gatewayUrl };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/account", "layout");
    return { ok: true, number: created.number };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    throw e;
  }
}
