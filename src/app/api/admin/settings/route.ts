import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { Settings } from "@/lib/models";
import { settingsFields } from "@/lib/resources";
import { normalize } from "@/lib/admin-normalize";
import { json, readJson, withDb, route } from "@/lib/api";
import { settings as defaults } from "@/lib/seed-data";

async function _GET() {
  const doc: any = await withDb(() => Settings.findOne({ key: "site" }).lean());
  return json({ item: { ...defaults, ...(doc?.data || {}) } });
}

async function _PUT(req: NextRequest, _ctx?: unknown) {
  const body = await readJson(req);
  const data = normalize({ fields: settingsFields }, body, true);
  const doc: any = await withDb(async () => {
    const current: any = await Settings.findOne({ key: "site" }).lean();
    const merged = { ...defaults, ...(current?.data || {}), ...data, socials: { ...(current?.data?.socials || defaults.socials), ...(body.socials || {}) } };
    return Settings.findOneAndUpdate({ key: "site" }, { $set: { data: merged } }, { upsert: true, new: true }).lean();
  });
  return json({ item: doc.data });
}

export const GET = route(_GET);
export const PUT = route(async (req, ctx) => {
  const res = await _PUT(req, ctx);
  if (res.ok) revalidateTag("content");
  return res;
});
