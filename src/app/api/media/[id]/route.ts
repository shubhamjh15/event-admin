import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { Media } from "@/lib/models";
import { fail, withDb, route } from "@/lib/api";

async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clean = id.replace(/\.[a-z0-9]+$/i, "");
  if (!isValidObjectId(clean)) return fail("Not found", 404);
  const doc: any = await withDb(() => Media.findById(clean).lean());
  if (!doc) return fail("Not found", 404);
  const buf: Buffer = Buffer.from(doc.data.buffer ?? doc.data);
  const total = buf.length;
  const headers: Record<string, string> = {
    "Content-Type": doc.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };
  // Range support so uploaded videos can stream / seek.
  const range = req.headers.get("range");
  const m = range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Length": String(total) } });
}

export const GET = route(_GET);
