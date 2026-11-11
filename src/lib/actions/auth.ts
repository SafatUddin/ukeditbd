"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isStaffRole, type SessionRole } from "@/lib/auth/jwt";
import { isAdminEmail } from "@/lib/auth/roles";
import { createSession, deleteSession } from "@/lib/auth/session";

export type AuthState = { error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string> } | undefined;

const loginSchema = z.object({
  email: z.email("Enter a valid email address").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address").transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number"),
});

const safeNext = (next: FormDataEntryValue | null) => {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
};

function destinationFor(role: SessionRole, next: string | null) {
  if (isStaffRole(role)) return next?.startsWith("/admin") ? next : "/admin";
  return next && !next.startsWith("/admin") ? next : "/";
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password.", values };
  }

  // The backend decides the role: emails listed in ADMIN_EMAILS are always admins.
  const role = isAdminEmail(email) ? "ADMIN" : user.role;
  await db.user.update({ where: { id: user.id }, data: { role, lastLoginAt: new Date() } });
  await createSession({ userId: user.id, email: user.email, name: user.name, role });

  redirect(destinationFor(role, safeNext(formData.get("next"))));
}

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { fieldErrors: { email: ["An account with this email already exists"] }, values };
  }

  const role: SessionRole = isAdminEmail(email) ? "ADMIN" : "CUSTOMER";
  const user = await db.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10), lastLoginAt: new Date() },
  });
  await createSession({ userId: user.id, email: user.email, name: user.name, role });

  redirect(destinationFor(role, safeNext(formData.get("next"))));
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
