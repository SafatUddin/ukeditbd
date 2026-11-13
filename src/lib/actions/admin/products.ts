"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { assertAdmin, fail, type ActionResult } from "./guard";

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(2, "SKU required"),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  colorHex: z.string().trim().optional().nullable(),
  price: z.number().int().nonnegative().optional().nullable(),
  costPrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  reorderPoint: z.number().int().nonnegative(),
  binLocation: z.string().trim().optional().nullable(),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().min(10, "Description should be at least 10 characters"),
  categoryId: z.string().min(1, "Choose a category"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  featured: z.boolean(),
  allowPreorder: z.boolean(),
  preorderDays: z.number().int().min(1).max(90),
  brand: z.string().trim().min(1, "Brand is required"),
  price: z.number().int().positive("Price must be greater than 0"),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  material: z.string().trim().optional().nullable(),
  care: z.string().trim().optional().nullable(),
  tags: z.string().trim(),
  images: z.array(z.string().trim().min(1)).min(1, "Add at least one image"),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const user = await assertAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid product");
  const { variants, images, id, ...p } = parsed.data;
  const slug = slugify(p.name);

  const skus = variants.map((v) => v.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) return fail("Each variant must have a unique SKU");
  const clash = await db.productVariant.findFirst({ where: { sku: { in: skus }, ...(id && { productId: { not: id } }) }, select: { sku: true } });
  if (clash) return fail(`SKU ${clash.sku} is already used by another product`);
  const slugClash = await db.product.findFirst({ where: { slug, ...(id && { id: { not: id } }) }, select: { id: true } });
  if (slugClash) return fail("Another product already uses this URL handle");

  const data = { ...p, slug, compareAtPrice: p.compareAtPrice || null };

  const productId = await db.$transaction(async (tx) => {
    const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });

    await tx.productImage.deleteMany({ where: { productId: product.id } });
    await tx.productImage.createMany({ data: images.map((url, i) => ({ productId: product.id, url, position: i, alt: `${p.name} view ${i + 1}` })) });

    const existing = await tx.productVariant.findMany({ where: { productId: product.id } });
    const keep = new Set(variants.map((v) => v.id).filter(Boolean));
    const removable = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (removable.length) {
      const used = await tx.orderItem.count({ where: { variantId: { in: removable } } });
      if (used) throw new Error("Cannot delete variants that have order history. Set stock to 0 instead.");
      await tx.productVariant.deleteMany({ where: { id: { in: removable } } });
    }

    for (const v of variants) {
      const fields = { sku: v.sku.toUpperCase(), size: v.size || null, color: v.color || null, colorHex: v.colorHex || null, price: v.price || null, costPrice: v.costPrice, reorderPoint: v.reorderPoint, reorderQty: v.reorderPoint * 4, binLocation: v.binLocation || null };
      const prev = existing.find((e) => e.id === v.id);
      if (prev) {
        await tx.productVariant.update({ where: { id: prev.id }, data: { ...fields, stock: v.stock } });
        if (prev.stock !== v.stock) {
          await tx.inventoryMovement.create({ data: { variantId: prev.id, type: "ADJUSTMENT", quantity: v.stock - prev.stock, stockAfter: v.stock, reason: "Edited in product form", userId: user.id } });
        }
      } else {
        const created = await tx.productVariant.create({ data: { ...fields, stock: v.stock, productId: product.id } });
        await tx.inventoryMovement.create({ data: { variantId: created.id, type: "INITIAL", quantity: v.stock, stockAfter: v.stock, reason: "Variant created", userId: user.id } });
      }
    }
    return product.id;
  }).catch((e: Error) => e);

  if (productId instanceof Error) return fail(productId.message);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, data: { id: productId }, message: id ? "Product updated" : "Product created" };
}

export async function setProductsStatus(ids: string[], status: "DRAFT" | "ACTIVE" | "ARCHIVED"): Promise<ActionResult> {
  await assertAdmin();
  await db.product.updateMany({ where: { id: { in: ids } }, data: { status } });
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: `${ids.length} product(s) set to ${status.toLowerCase()}` };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await assertAdmin();
  const hasOrders = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (hasOrders) {
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidatePath("/admin/products");
    return { ok: true, message: "Product has order history, so it was archived instead of deleted" };
  }
  await db.$transaction([db.purchaseOrderItem.deleteMany({ where: { variant: { productId: id } } }), db.product.delete({ where: { id } })]);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, message: "Product deleted" };
}
