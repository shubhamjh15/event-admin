import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { getResource } from "@/lib/registry";
import { fail, json, readJson, withDb, route } from "@/lib/api";
import { normalize } from "@/lib/admin-normalize";

type Ctx = { params: Promise<{ resource: string; id: string }> };

async function resolve(ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const r = getResource(resource);
  if (!r || !isValidObjectId(id)) return null;
  return { ...r, id };
}

async function _GET(_: NextRequest, ctx: Ctx) {
  const r = await resolve(ctx);
  if (!r) return fail("Not found", 404);
  const item = await withDb(() => r.model.findById(r.id).lean());
  return item ? json({ item }) : fail("Not found", 404);
}

async function _PUT(req: NextRequest, ctx: Ctx) {
  const r = await resolve(ctx);
  if (!r) return fail("Not found", 404);
  const body = await readJson(req);
  // Partial updates (e.g. inline status toggles) only touch provided fields.
  const data = normalize(r.resource, body, true);
  try {
    const item = await withDb(() => r.model.findByIdAndUpdate(r.id, { $set: data }, { new: true, runValidators: true }).lean());
    return item ? json({ item }) : fail("Not found", 404);
  } catch (e: any) {
    if (e?.code === 11000) return fail("That slug / key is already in use. Please choose another.", 409);
    return fail(e?.message || "Could not save", 400);
  }
}

async function _DELETE(_: NextRequest, ctx: Ctx) {
  const r = await resolve(ctx);
  if (!r) return fail("Not found", 404);
  await withDb(() => r.model.findByIdAndDelete(r.id));
  return json({ ok: true });
}

export const GET = route(_GET);
export const PUT = route(async (req, ctx) => {
  const res = await _PUT(req, ctx);
  if (res.ok) revalidateTag("content");
  return res;
});
export const DELETE = route(async (req, ctx) => {
  const res = await _DELETE(req, ctx);
  if (res.ok) revalidateTag("content");
  return res;
});
