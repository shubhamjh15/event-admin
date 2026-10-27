import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lit_admin";

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-only-secret-change-me");
}

export async function signSession(payload: { id: string; email: string; name?: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { id: string; email: string; name?: string };
  } catch {
    return null;
  }
}
