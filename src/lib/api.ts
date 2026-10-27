import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "./db";

const hits = new Map<string, number[]>();

/** Simple in-memory sliding-window rate limit per IP + route. */
export function rateLimited(req: NextRequest, key: string, max = 8, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const list = (hits.get(id) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(id, list);
  return list.length > max;
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pick allowed string fields, trimmed and length-capped. */
export function clean(body: any, fields: string[], max = 2000) {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = body?.[f];
    if (v != null && v !== "") out[f] = String(v).trim().slice(0, max);
  }
  return out;
}

export function requireFields(data: Record<string, any>, fields: string[]) {
  for (const f of fields) if (!data[f]) return `Please provide your ${f}.`;
  if (data.email && !EMAIL.test(data.email)) return "Please enter a valid email address.";
  return null;
}

type Handler = (req: NextRequest, ctx: any) => Promise<Response>;

/** Wrap a route handler so unexpected failures (e.g. DB outage) return clean JSON instead of crashing. */
export function route(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, e);
      return fail("Something went wrong on our side. Please try again in a moment.", 500);
    }
  };
}

export async function withDb<T>(fn: () => Promise<T>) {
  await dbConnect();
  return fn();
}

export async function readJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
