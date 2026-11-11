"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { isAdminEmail } from "@/lib/auth/roles";
import { assertAdmin, fail, type ActionResult } from "./guard";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  sortOrder: z.number().int(),
});

export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid category");
  const { id, ...rest } = parsed.data;
  const slug = slugify(rest.name);
  if (await db.category.findFirst({ where: { slug, ...(id && { id: { not: id } }) } })) return fail("A category with this name already exists");
  const data = { ...rest, slug, image: rest.image || null, description: rest.description || null };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Category updated" : "Category created" };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await assertAdmin();
  if (await db.product.count({ where: { categoryId: id } })) return fail("Move or delete this category's products first");
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, message: "Category deleted" };
}

export async function updateProfile(input: { name: string; phone?: string }): Promise<ActionResult> {
  const user = await assertAdmin();
  if (input.name.trim().length < 2) return fail("Name is too short");
  await db.user.update({ where: { id: user.id }, data: { name: input.name.trim(), phone: input.phone?.trim() || null } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated" };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

export async function changePassword(input: z.input<typeof passwordSchema>): Promise<ActionResult> {
  const user = await assertAdmin();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid password");
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(parsed.data.current, record.passwordHash))) return fail("Current password is incorrect");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 10) } });
  return { ok: true, message: "Password changed" };
}

export async function setUserRole(userId: string, role: "CUSTOMER" | "STAFF" | "ADMIN"): Promise<ActionResult> {
  const actor = await assertAdmin();
  if (actor.role !== "ADMIN") return fail("Only admins can change roles");
  if (actor.id === userId) return fail("You cannot change your own role");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return fail("User not found");
  if (isAdminEmail(target.email) && role !== "ADMIN") return fail("This email is listed in ADMIN_EMAILS and is always an admin");
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/customers");
  return { ok: true, message: `${target.name} is now ${role.toLowerCase()}` };
}
