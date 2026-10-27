import { revalidateTag } from "next/cache";
import { json, withDb, route } from "@/lib/api";
import { resetContent } from "@/lib/seed";

async function _POST(_req?: unknown, _ctx?: unknown) {
  await withDb(() => resetContent());
  return json({ ok: true });
}

export const POST = route(async (req, ctx) => {
  const res = await _POST(req, ctx);
  if (res.ok) revalidateTag("content");
  return res;
});
