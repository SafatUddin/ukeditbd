import "server-only";
import { getCurrentUser } from "@/lib/auth/dal";
import { isStaffRole } from "@/lib/auth/jwt";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) throw new Error("Unauthorized");
  return user;
}

export const fail = (error: string): ActionResult<never> => ({ ok: false, error });
