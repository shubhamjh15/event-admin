import { NextRequest } from "next/server";
import { Media } from "@/lib/models";
import { fail, json, withDb, route } from "@/lib/api";

// Vercel caps request bodies at 4.5 MB, so keep uploads safely below it.
const MAX = 4 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|avif|svg\+xml)|video\/(mp4|webm|quicktime))$/;

async function _POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return fail("No file uploaded");
  if (!ALLOWED.test(file.type)) return fail("Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, SVG, MP4 or WEBM.");
  if (file.size > MAX) return fail("File too large (max 4 MB). Compress the image, or paste a hosted video URL for videos.");
  const data = Buffer.from(await file.arrayBuffer());
  const doc = await withDb(() => Media.create({ filename: file.name, contentType: file.type, size: file.size, data }));
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return json({ url: `/api/media/${doc._id}${ext ? "." + ext : ""}` }, 201);
}

export const POST = route(_POST);
