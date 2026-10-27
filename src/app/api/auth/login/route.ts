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
  const token = await signSession({ id: String(user._id), email: user.email, name: user.name });
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export const POST = route(_POST);
