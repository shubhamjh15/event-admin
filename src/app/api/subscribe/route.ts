import { NextRequest } from "next/server";
import { Subscriber } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";

async function _POST(req: NextRequest) {
  if (rateLimited(req, "subscribe", 5)) return fail("Too many requests.", 429);
  const data = clean(await readJson(req), ["email"], 200);
  const err = requireFields(data, ["email"]);
  if (err) return fail(err);
  await withDb(() => Subscriber.updateOne({ email: data.email.toLowerCase() }, { $set: { active: true } }, { upsert: true }));
  return json({ ok: true }, 201);
}

export const POST = route(_POST);
