import type { Field, Resource } from "./resources";
import { slugify } from "./resources";

function coerce(field: Field, v: any): any {
  if (v === undefined) return undefined;
  switch (field.type) {
    case "number":
      return v === "" || v == null ? undefined : Number(v);
    case "boolean":
      return v === true || v === "true" || v === "on";
    case "tags":
      return Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
    case "images":
      return Array.isArray(v) ? v.filter(Boolean) : [];
    case "slug":
      return slugify(String(v || ""));
    case "list":
      return Array.isArray(v)
        ? v.map((row) => Object.fromEntries((field.fields || []).map((sf) => [sf.name, coerce(sf, row?.[sf.name])])))
        : [];
    default:
      return v == null ? "" : typeof v === "string" ? v : String(v);
  }
}

/** Keep only declared fields and coerce them to their storage types. */
export function normalize(resource: Pick<Resource, "fields">, body: any, partial = false) {
  const out: Record<string, any> = {};
  for (const f of resource.fields) {
    if (partial && !(f.name in (body || {}))) continue;
    const v = coerce(f, body?.[f.name]);
    if (v !== undefined) out[f.name] = v;
  }
  if (!partial) {
    const slug = resource.fields.find((f) => f.type === "slug");
    if (slug && !out[slug.name]) out[slug.name] = slugify(body?.title || body?.name || "");
  }
  return out;
}
