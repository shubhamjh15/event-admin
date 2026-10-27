import { NextRequest } from "next/server";
import { Enquiry } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";

async function _POST(req: NextRequest) {
  if (rateLimited(req, "enquiry")) return fail("Too many requests. Please try again shortly.", 429);
  const body = await readJson(req);
  if (body.website) return json({ ok: true }); // honeypot
  const data = clean(body, ["name", "email", "phone", "eventType", "eventDate", "guests", "budget", "destination", "message", "source"]);
  const err = requireFields(data, ["name", "email", "phone"]);
  if (err) return fail(err);
  const doc = await withDb(() => Enquiry.create({ ...data, status: "new" }));
  return json({ ok: true, id: String(doc._id) }, 201);
}

export const POST = route(_POST);
