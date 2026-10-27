import { NextRequest } from "next/server";
import { Blog, Comment } from "@/lib/models";
import { clean, fail, json, rateLimited, readJson, requireFields, withDb, route } from "@/lib/api";

async function _POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (rateLimited(req, "comment", 4)) return fail("Too many comments. Please try again shortly.", 429);
  const body = await readJson(req);
  const data = clean(body, ["name", "email", "text"], 1500);
  const err = requireFields(data, ["name", "email", "text"]);
  if (err) return fail(err);
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
  return withDb(async () => {
    if (!(await Blog.exists({ slug }))) return fail("Article not found.", 404);
    await Comment.create({ ...data, blog: slug, rating, approved: false });
    return json({ ok: true }, 201);
  });
}

export const POST = route(_POST);
