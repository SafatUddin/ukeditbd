"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin, fail, type ActionResult } from "./guard";

const adjustSchema = z.object({
  variantId: z.string().min(1),
  mode: z.enum(["add", "remove", "set"]),
  type: z.enum(["RECEIVED", "RETURN", "ADJUSTMENT", "DAMAGE"]),
  quantity: z.number().int().nonnegative(),
  reason: z.string().trim().max(200).optional(),
});

export type AdjustInput = z.infer<typeof adjustSchema>;

export async function adjustStock(input: AdjustInput): Promise<ActionResult<{ stock: number }>> {
  const user = await assertAdmin();
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid adjustment");
  const { variantId, mode, type, quantity, reason } = parsed.data;

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return fail("Variant not found");

  const next = mode === "set" ? quantity : mode === "add" ? variant.stock + quantity : variant.stock - quantity;
  if (next < 0) return fail(`Cannot remove ${quantity}; only ${variant.stock} on hand`);
  const delta = next - variant.stock;
  if (delta === 0) return fail("No change in stock");

  await db.$transaction([
    db.productVariant.update({ where: { id: variantId }, data: { stock: next } }),
    db.inventoryMovement.create({ data: { variantId, type, quantity: delta, stockAfter: next, reason: reason || null, userId: user.id } }),
  ]);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, data: { stock: next }, message: `Stock updated: ${variant.stock} → ${next}` };
}

export async function updateVariantSettings(variantId: string, data: { reorderPoint: number; reorderQty: number; binLocation: string | null }): Promise<ActionResult> {
  await assertAdmin();
  await db.productVariant.update({
    where: { id: variantId },
    data: { reorderPoint: Math.max(0, data.reorderPoint), reorderQty: Math.max(1, data.reorderQty), binLocation: data.binLocation || null },
  });
  revalidatePath("/admin/inventory");
  return { ok: true, message: "Reorder settings saved" };
}
