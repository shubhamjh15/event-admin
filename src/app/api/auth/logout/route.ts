import { route } from "@/lib/api";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

async function _POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const POST = route(_POST);
