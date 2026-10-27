import { NextRequest } from "next/server";
import { Booking } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";

async function _POST(req: NextRequest) {
  if (rateLimited(req, "booking")) return fail("Too many requests. Please try again shortly.", 429);
  const body = await readJson(req);
  const data = clean(body, ["kind", "name", "email", "phone", "eventPackage", "eventDate", "time", "guests", "mode", "paymentMethod", "message"]);
  data.kind = data.kind === "appointment" ? "appointment" : "booking";
  const err = requireFields(data, ["name", "email", "phone", "eventDate"]);
  if (err) return fail(err);
  if (data.kind === "appointment" && !data.time) return fail("Please choose a preferred time.");
  const doc = await withDb(() => Booking.create({ ...data, status: "pending" }));
  return json({ ok: true, id: String(doc._id) }, 201);
}

export const POST = route(_POST);
