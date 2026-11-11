"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/dal";
import { variantLabel } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";

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
    paymentMethod: z.enum(["COD", "CARD"]),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
    saveAddress: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== "CARD") return;
    if (!/^\d{16}$/.test((v.cardNumber ?? "").replace(/\s/g, ""))) ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a 16-digit card number" });
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.cardExpiry ?? "")) ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "Use MM/YY" });
    if (!/^\d{3,4}$/.test(v.cardCvc ?? "")) ctx.addIssue({ code: "custom", path: ["cardCvc"], message: "3–4 digits" });
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult = { ok: true; number: string } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

class CheckoutError extends Error {}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please sign in to complete your purchase." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please review the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const data = parsed.data;

  // Mock payment gateway: cards ending in 0002 are declined.
  if (data.paymentMethod === "CARD" && data.cardNumber!.replace(/\s/g, "").endsWith("0002")) {
    return { ok: false, error: "Your card was declined by the issuer. Try another card or choose Cash on Delivery." };
  }

  try {
    const number = await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: data.items.map((i) => i.variantId) } },
        include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
      });

      const lines = data.items.map((item) => {
        const v = variants.find((x) => x.id === item.variantId);
        if (!v || v.product.status !== "ACTIVE") throw new CheckoutError("An item in your bag is no longer available.");
        const preorder = v.stock < item.quantity && v.product.allowPreorder;
        if (v.stock < item.quantity && !preorder) throw new CheckoutError(`Only ${Math.max(0, v.stock)} left of ${v.product.name} (${variantLabel(v)}). Please update your bag.`);
        return { v, quantity: item.quantity, unitPrice: v.price ?? v.product.price, preorder };
      });
      const hasPreorder = lines.some((l) => l.preorder);

      const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const shippingFee = shippingFor(subtotal, data.city);
      const [{ max }] = await tx.$queryRaw<{ max: number | bigint | null }[]>`SELECT MAX(CAST(SUBSTR(number, 4) AS INTEGER)) AS max FROM "Order"`;
      const number = `UK-${Math.max(Number(max ?? 0), 1000) + 1}`;

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
          paymentStatus: data.paymentMethod === "CARD" ? "PAID" : "UNPAID",
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
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
              ...(data.paymentMethod === "CARD" ? [{ message: "Card payment captured (mock gateway)", actor: "System" }] : []),
              ...(hasPreorder ? [{ message: "Includes pre-order items — sourcing from the UK", actor: "System" }] : []),
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
      return number;
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/account", "layout");
    return { ok: true, number };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    throw e;
  }
}
