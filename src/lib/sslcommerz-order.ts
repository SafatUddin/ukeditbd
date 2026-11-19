import "server-only";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { validateSslcommerzPayment } from "@/lib/sslcommerz";

export async function finalizeSslcommerzSuccess(valId: string, tranIdFromForm?: string) {
  const validated = await validateSslcommerzPayment(valId);
  if (!validated.ok) return { ok: false as const, error: validated.error, orderNumber: tranIdFromForm ?? "" };

  const order = await db.order.findUnique({
    where: { number: validated.tranId },
    include: { items: true },
  });
  if (!order) return { ok: false as const, error: "Order not found", orderNumber: validated.tranId };

  // Idempotent: if already confirmed/paid with this paymentRef, succeed cleanly
  if (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID") {
    return { ok: true as const, orderNumber: order.number };
  }

  const paidNow = validated.amount;
  const newPaid = Math.min(order.total, paidNow);
  const newDue = Math.max(0, order.total - newPaid);
  const paymentStatus = newDue === 0 ? "PAID" : "PARTIALLY_PAID";
  const gatewayLabel = validated.cardType ? `SSLCommerz (${validated.cardType})` : "SSLCommerz";
  const hasPreorder = order.items.some((i) => i.preorder);

  await db.order.update({
    where: { id: order.id },
    data: {
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      paymentStatus,
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentRef: validated.bankTranId || validated.valId,
      paymentGateway: gatewayLabel,
      events: {
        create: {
          status: order.status === "PENDING" ? "CONFIRMED" : undefined,
          message:
            newDue > 0 && hasPreorder
              ? `20% pre-order advance (${formatPrice(newPaid)}) paid via ${gatewayLabel}. Remaining ${formatPrice(newDue)} due on delivery.`
              : `Full payment (${formatPrice(newPaid)}) received via ${gatewayLabel}.`,
          actor: "SSLCommerz",
        },
      },
    },
  });

  return { ok: true as const, orderNumber: order.number };
}

export async function handleSslcommerzFailure(tranId: string, reason: "failed" | "cancelled") {
  if (!tranId) return;
  const order = await db.order.findUnique({
    where: { number: tranId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID" || order.status === "CANCELLED") {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
        events: {
          create: {
            status: "CANCELLED",
            message: reason === "cancelled" ? "Payment cancelled by customer on SSLCommerz" : "SSLCommerz payment failed",
            actor: "SSLCommerz",
          },
        },
      },
    });

    for (const item of order.items) {
      if (!item.variantId) continue;
      const updated = await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: item.variantId,
          type: "RETURN",
          quantity: item.quantity,
          stockAfter: updated.stock,
          reason: reason === "cancelled" ? "Payment cancelled — stock restored" : "Payment failed — stock restored",
          reference: order.number,
        },
      });
    }
  });
}
