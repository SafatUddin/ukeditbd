"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin, fail, type ActionResult } from "./guard";

const poSchema = z.object({
  supplierId: z.string().min(1, "Choose a supplier"),
  expectedAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  submit: z.boolean(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().positive(), unitCost: z.number().int().nonnegative() }))
    .min(1, "Add at least one line item"),
});

export type POInput = z.input<typeof poSchema>;

export async function createPurchaseOrder(input: POInput): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = poSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid purchase order");
  const { items, submit, expectedAt, ...rest } = parsed.data;

  const [{ max }] = await db.$queryRaw<{ max: number | bigint | null }[]>`SELECT MAX(CAST(SUBSTR(number, 4) AS INTEGER)) AS max FROM PurchaseOrder`;
  const number = `PO-${Math.max(Number(max ?? 0), 2026000) + 1}`;
  const po = await db.purchaseOrder.create({
    data: {
      ...rest,
      number,
      status: submit ? "ORDERED" : "DRAFT",
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      items: { create: items },
    },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, data: { id: po.id }, message: `${number} ${submit ? "sent to supplier" : "saved as draft"}` };
}

export async function setPurchaseOrderStatus(id: string, status: "ORDERED" | "CANCELLED"): Promise<ActionResult> {
  await assertAdmin();
  const po = await db.purchaseOrder.findUnique({ where: { id } });
  if (!po) return fail("Purchase order not found");
  if (status === "ORDERED" && po.status !== "DRAFT") return fail("Only drafts can be submitted");
  if (status === "CANCELLED" && !["DRAFT", "ORDERED"].includes(po.status)) return fail("This purchase order can no longer be cancelled");
  await db.purchaseOrder.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: status === "ORDERED" ? "Purchase order submitted" : "Purchase order cancelled" };
}

export async function receivePurchaseOrder(id: string, lines: { itemId: string; quantity: number }[]): Promise<ActionResult> {
  const user = await assertAdmin();
  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) return fail("Purchase order not found");
  if (!["ORDERED", "PARTIAL"].includes(po.status)) return fail("Only submitted purchase orders can be received");

  const valid = lines.filter((l) => l.quantity > 0);
  if (!valid.length) return fail("Enter a quantity to receive");

  await db.$transaction(async (tx) => {
    for (const line of valid) {
      const item = po.items.find((i) => i.id === line.itemId);
      if (!item) continue;
      const qty = Math.min(line.quantity, item.quantity - item.received);
      if (qty <= 0) continue;
      await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { received: { increment: qty } } });
      const v = await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: qty }, costPrice: item.unitCost } });
      await tx.inventoryMovement.create({
        data: { variantId: v.id, type: "RECEIVED", quantity: qty, stockAfter: v.stock, reason: "Purchase order receipt", reference: po.number, userId: user.id },
      });
    }
    const items = await tx.purchaseOrderItem.findMany({ where: { poId: id } });
    const complete = items.every((i) => i.received >= i.quantity);
    await tx.purchaseOrder.update({ where: { id }, data: { status: complete ? "RECEIVED" : "PARTIAL", receivedAt: complete ? new Date() : null } });
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: "Stock received and inventory updated" };
}

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required"),
  contactName: z.string().trim().optional(),
  email: z.union([z.email("Invalid email"), z.literal("")]).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  leadTimeDays: z.number().int().min(0).max(365),
  notes: z.string().trim().optional(),
});

export type SupplierInput = z.input<typeof supplierSchema>;

export async function saveSupplier(input: SupplierInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid supplier");
  const { id, ...data } = parsed.data;
  if (id) await db.supplier.update({ where: { id }, data });
  else await db.supplier.create({ data });
  revalidatePath("/admin/suppliers");
  return { ok: true, message: id ? "Supplier updated" : "Supplier added" };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  await assertAdmin();
  if (await db.purchaseOrder.count({ where: { supplierId: id } })) return fail("Supplier has purchase orders and cannot be deleted");
  await db.supplier.delete({ where: { id } });
  revalidatePath("/admin/suppliers");
  return { ok: true, message: "Supplier deleted" };
}
