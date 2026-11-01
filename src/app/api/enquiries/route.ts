import { NextRequest } from "next/server";
import { Enquiry } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";
import { notifyEnquiry } from "@/lib/notify";

async function _POST(req: NextRequest) {
  if (rateLimited(req, "enquiry")) return fail("Too many requests. Please try again shortly.", 429);
  const body = await readJson(req);
  if (body.website) return json({ ok: true }); // honeypot
  const data = clean(body, ["name", "email", "phone", "eventType", "eventTypeOther", "eventDate", "guests", "budget", "destination", "message", "source"]);
  const err = requireFields(data, ["name", "email", "phone"]);
  if (err) return fail(err);
  if (data.eventType === "Other") {
    if (!data.eventTypeOther) return fail("Please tell us what the occasion is.");
    data.eventType = `Other — ${data.eventTypeOther.slice(0, 120)}`;
  }
  delete data.eventTypeOther;
  data.email = data.email.toLowerCase();
  const doc: any = await withDb(() => Enquiry.create({ ...data, status: "new" }));
  // Emails are sent before responding (serverless functions stop once the response is sent),
  // but a mail failure never fails the enquiry itself.
  const log = await notifyEnquiry({ ...data, _id: doc._id }).catch((e) => `Email error: ${e?.message || e}`);
  await Enquiry.updateOne({ _id: doc._id }, { $set: { emailLog: log } }).catch(() => {});
  return json({ ok: true, id: String(doc._id) }, 201);
}

export const POST = route(_POST);
