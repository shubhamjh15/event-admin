import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { AdminUser } from "@/lib/models";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { fail, json, readJson, withDb, route } from "@/lib/api";

async function _PUT(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return fail("Unauthorized", 401);
  const { currentPassword, newPassword, name, email } = await readJson(req);
  return withDb(async () => {
    const user: any = await AdminUser.findById(session.id);
    if (!user) return fail("Account not found", 404);
    if (!(await bcrypt.compare(String(currentPassword || ""), user.passwordHash))) return fail("Current password is incorrect.", 400);
    if (newPassword) {
      if (String(newPassword).length < 8) return fail("New password must be at least 8 characters.");
      user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    }
    if (name) user.name = String(name).slice(0, 100);
    if (email) user.email = String(email).toLowerCase().trim();
    try {
      await user.save();
    } catch (e: any) {
      if (e?.code === 11000) return fail("Another admin already uses that email.", 409);
      throw e;
    }
    return json({ ok: true });
  });
}

export const PUT = route(_PUT);
