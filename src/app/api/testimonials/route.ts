import { NextRequest } from "next/server";
import { Testimonial } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";
import { notifyTestimonial } from "@/lib/notify";

/** Public "share your experience" submissions. Stored unapproved until an admin reviews them. */
async function _POST(req: NextRequest) {
  if (rateLimited(req, "testimonial", 3)) return fail("Too many submissions. Please try again later.", 429);
  const body = await readJson(req);
  if (body.website) return json({ ok: true }); // honeypot
  const data = clean(body, ["name", "email", "role", "quote"], 1200);
  const err = requireFields(data, ["name", "email", "quote"]);
  if (err) return fail(err);
  if (data.quote.length < 20) return fail("Please write a little more about your experience (at least 20 characters).");
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
  const doc: any = await withDb(() =>
    Testimonial.create({ ...data, email: data.email.toLowerCase(), rating, source: "public", approved: false, order: 999 }),
  );
  await notifyTestimonial({ ...data, rating, _id: doc._id }).catch(() => {});
  return json({ ok: true }, 201);
}

export const POST = route(_POST);
