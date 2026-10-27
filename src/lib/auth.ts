import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lit_admin";

const PLACEHOLDER = "change-me-to-a-long-random-string";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s === PLACEHOLDER || s.length < 24) {
    // Fail closed in production: never sign or accept sessions with a guessable secret.
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set to a long random string (24+ characters).");
    return new TextEncoder().encode(s || "dev-only-secret-change-me");
  }
  return new TextEncoder().encode(s);
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
