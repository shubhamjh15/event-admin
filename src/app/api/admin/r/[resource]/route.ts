import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { getResource } from "@/lib/registry";
import { fail, json, readJson, withDb, route } from "@/lib/api";
import { normalize } from "@/lib/admin-normalize";

type Ctx = { params: Promise<{ resource: string }> };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toCsv(rows: any[], fields: string[]) {
  const esc = (v: any) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [fields.join(","), ...rows.map((r) => fields.map((f) => esc(r[f])).join(","))].join("\n");
}

async function _GET(req: NextRequest, { params }: Ctx) {
  const { resource: key } = await params;
  const r = getResource(key);
  if (!r) return fail("Unknown resource", 404);
  const { resource, model } = r;
  const sp = req.nextUrl.searchParams;

  const filter: any = {};
  const q = sp.get("q")?.trim();
  if (q) filter.$or = resource.search.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: "i" } }));
  for (const f of resource.filters || []) {
    const v = sp.get(f.name);
    if (v) filter[f.name] = v === "true" ? true : v === "false" ? { $ne: true } : v;
  }

  return withDb(async () => {
    if (sp.get("all")) {
      const items = await model.find(filter).sort(resource.sort).lean();
      return json({ items });
    }
    if (sp.get("format") === "csv") {
      const items = await model.find(filter).sort(resource.sort).lean();
      const fields = [...resource.fields.filter((f) => f.type !== "list").map((f) => f.name), "createdAt"];
      return new Response(toCsv(items, fields), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${key}-${new Date().toISOString().slice(0, 10)}.csv"` },
      });
    }
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const [items, total] = await Promise.all([
      model.find(filter).sort(resource.sort).skip((page - 1) * limit).limit(limit).lean(),
      model.countDocuments(filter),
    ]);
    return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  });
}

async function _POST(req: NextRequest, { params }: Ctx) {
  const { resource: key } = await params;
  const r = getResource(key);
  if (!r) return fail("Unknown resource", 404);
  const data = normalize(r.resource, await readJson(req));
  try {
    const doc: any = await withDb(() => r.model.create(data));
    return json({ item: doc.toObject() }, 201);
  } catch (e: any) {
    if (e?.code === 11000) return fail("That slug / key is already in use. Please choose another.", 409);
    return fail(e?.message || "Could not save", 400);
  }
}

export const GET = route(_GET);
export const POST = route(async (req, ctx) => {
  const res = await _POST(req, ctx);
  if (res.ok) revalidateTag("content");
  return res;
});
