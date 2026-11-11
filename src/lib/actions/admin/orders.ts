"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { orderStatusMessages as messages, orderTransitions as transitions, type OrderStatusValue } from "@/lib/order-flow";
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
          ...(status === "DELIVERED" && order.paymentMethod === "COD" && { paymentStatus: "PAID" }),
          ...(restock && order.paymentStatus === "PAID" && { paymentStatus: "REFUNDED" }),
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

export async function markOrderPaid(orderId: string): Promise<ActionResult> {
  const user = await assertAdmin();
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID", events: { create: { message: "Payment recorded as received", actor: user.name } } },
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
