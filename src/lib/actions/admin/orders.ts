"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { orderStatusMessages as messages, orderTransitions as transitions, type OrderStatusValue } from "@/lib/order-flow";
import { preorderAdvanceFor } from "@/lib/payment";
import { assertAdmin, fail, type ActionResult } from "./guard";

export async function updateOrderStatus(orderIds: string | string[], status: OrderStatusValue, note?: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
  const orders = await db.order.findMany({ where: { id: { in: ids } }, include: { items: true } });
  const eligible = orders.filter((o) => transitions[o.status].includes(status));
  if (!eligible.length) return fail(`Selected order(s) cannot be moved to ${status.toLowerCase()}`);

  await db.$transaction(async (tx) => {
    for (const order of eligible) {
      const restock = status === "CANCELLED" || status === "REFUNDED";
      await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          ...(status === "DELIVERED" && order.dueAmount > 0 && { paymentStatus: "PAID", paidAmount: order.total, dueAmount: 0 }),
          ...(restock && (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_PAID") && { paymentStatus: "REFUNDED" }),
          events: { create: { status, message: note?.trim() ? `${messages[status]} — ${note.trim()}` : messages[status], actor: user.name } },
        },
      });
      if (restock) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const v = await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          await tx.inventoryMovement.create({
            data: { variantId: v.id, type: "RETURN", quantity: item.quantity, stockAfter: v.stock, reason: status === "CANCELLED" ? "Order cancelled — restocked" : "Order refunded — restocked", reference: order.number, userId: user.id },
          });
        }
      }
    }
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/account", "layout");
  const skipped = ids.length - eligible.length;
  return { ok: true, message: `${eligible.length} order(s) marked ${status.toLowerCase()}${skipped ? ` · ${skipped} skipped` : ""}` };
}

export async function confirmPreorderAdvance(orderId: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const order = await db.order.findUnique({ where: { id: orderId }, select: { total: true, status: true } });
  if (!order) return fail("Order not found");
  const advance = preorderAdvanceFor(order.total);
  const due = Math.max(0, order.total - advance);
  await db.order.update({
    where: { id: orderId },
    data: {
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      paymentStatus: "PARTIALLY_PAID",
      paidAmount: advance,
      dueAmount: due,
      events: {
        create: {
          status: order.status === "PENDING" ? "CONFIRMED" : undefined,
          message: `20% bKash advance (${formatPrice(advance)}) verified — remaining ${formatPrice(due)} due on delivery`,
          actor: user.name,
        },
      },
    },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `20% advance (${formatPrice(advance)}) confirmed` };
}

export async function markOrderPaid(orderId: string): Promise<ActionResult> {
  const user = await assertAdmin();
  const order = await db.order.findUnique({ where: { id: orderId }, select: { total: true } });
  if (!order) return fail("Order not found");
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      paidAmount: order.total,
      dueAmount: 0,
      events: { create: { message: "Full payment recorded as received", actor: user.name } },
    },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Payment marked as received" };
}

export async function addOrderNote(orderId: string, note: string): Promise<ActionResult> {
  const user = await assertAdmin();
  if (!note.trim()) return fail("Note cannot be empty");
  await db.orderEvent.create({ data: { orderId, message: note.trim(), actor: user.name } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Note added" };
}
