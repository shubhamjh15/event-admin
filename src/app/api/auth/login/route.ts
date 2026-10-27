import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { AdminUser } from "@/lib/models";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import { fail, json, rateLimited, readJson, withDb, route } from "@/lib/api";

async function _POST(req: NextRequest) {
  if (rateLimited(req, "login", 10, 5 * 60_000)) return fail("Too many attempts. Try again in a few minutes.", 429);
  const { email, password } = await readJson(req);
  if (!email || !password) return fail("Email and password are required.");
  const user: any = await withDb(() => AdminUser.findOne({ email: String(email).toLowerCase().trim() }).lean());
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) return fail("Invalid email or password.", 401);
  let token: string;
  try {
    token = await signSession({ id: String(user._id), email: user.email, name: user.name });
  } catch (e) {
    console.error("[auth]", e);
    return fail("Admin login is not configured on this server (JWT_SECRET missing).", 500);
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    secure: (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")) === "https",
  });
  return res;
}

export const POST = route(_POST);
