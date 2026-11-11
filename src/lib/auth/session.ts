import "server-only";
import { cookies } from "next/headers";
import { decrypt, encrypt, SESSION_COOKIE, SESSION_TTL_SECONDS, type SessionPayload } from "./jwt";

export async function createSession(payload: SessionPayload) {
  const token = await encrypt(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession() {
  return decrypt((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
