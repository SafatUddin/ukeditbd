import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ukedit_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "CUSTOMER" | "STAFF" | "ADMIN";
export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: SessionRole;
};

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing or too short");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export const isStaffRole = (role?: SessionRole) => role === "ADMIN" || role === "STAFF";
