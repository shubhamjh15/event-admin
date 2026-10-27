import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getCategories, getEvents, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Redact anything that looks like a connection string or credential from an error message. */
const safe = (e: unknown) =>
  String((e as any)?.message || e)
    .replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, "mongodb://[redacted]")
    .slice(0, 300);

async function step<T>(fn: () => Promise<T>) {
  const t0 = Date.now();
  try {
    const v = await fn();
    return { ok: true, ms: Date.now() - t0, value: v };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, error: safe(e), name: (e as any)?.name };
  }
}

/** Health check: reports which layer fails (env, database, cached data reads). Never exposes secrets. */
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  let siteOk = false;
  try { new URL(site); siteOk = true; } catch {}

  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: (process.env.JWT_SECRET || "").length >= 24,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    NEXT_PUBLIC_SITE_URL_valid: siteOk,
    NODE_ENV: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION || null,
  };

  const db = await step(async () => { await dbConnect(); return "connected"; });
  const settings = await step(async () => (await getSettings()).siteName);
  const categories = await step(async () => (await getCategories()).length);
  const events = await step(async () => (await getEvents()).length);

  const ok = db.ok && settings.ok && categories.ok && events.ok;
  return NextResponse.json({ ok, env, db, settings, categories, events }, { status: ok ? 200 : 500 });
}
