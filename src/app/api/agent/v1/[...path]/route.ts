import { NextRequest, NextResponse } from "next/server";
import { rateLimited, readJson } from "@/lib/api";
import {
  CommerceError, bookQuote, bookingStatus, businessInfo, createQuote, getQuote, negotiateQuote, packageDetail, searchPackages, submitEnquiry,
} from "@/lib/commerce/engine";
import { CORS, agentError, agentJson, agentName } from "@/lib/commerce/http";
import { openApiSpec } from "@/lib/commerce/openapi";

/**
 * REST mirror of the MCP tools, for agent platforms that consume OpenAPI (custom GPT Actions,
 * Gemini / Vertex extensions, LangChain, n8n…). Spec: /api/agent/v1/openapi.json
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Ctx = { params: Promise<{ path: string[] }> };

const numParam = (v: string | null) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);

async function _GET(req: NextRequest, { params }: Ctx) {
  const path = (await params).path;
  const sp = req.nextUrl.searchParams;
  const [a, b] = path;
  if (path.length === 1 && a === "openapi.json") return agentJson(await openApiSpec(), 200, { "Cache-Control": "public, max-age=300" });
  if (path.length === 1 && a === "business") return agentJson(await businessInfo());
  if (path.length === 1 && a === "packages") {
    return agentJson(await searchPackages({
      query: sp.get("query") || undefined, category: sp.get("category") || undefined, destination: sp.get("destination") || undefined,
      guests: numParam(sp.get("guests")), maxBudget: numParam(sp.get("maxBudget")), limit: numParam(sp.get("limit")),
    }));
  }
  if (path.length === 2 && a === "packages") return agentJson(await packageDetail(b));
  if (path.length === 2 && a === "quotes") return agentJson(await getQuote(b));
  if (path.length === 2 && a === "bookings") return agentJson(await bookingStatus({ quoteRef: b, email: sp.get("email") || "" }));
  throw new CommerceError("Unknown endpoint. See /api/agent/v1/openapi.json", 404, "not_found");
}

async function _POST(req: NextRequest, { params }: Ctx) {
  if (rateLimited(req, "agent-write", 30)) throw new CommerceError("Rate limit reached. Please wait a minute and try again.", 429, "rate_limited");
  const path = (await params).path;
  const body = await readJson(req);
  const ctx = { channel: "rest" as const, agent: agentName(req) };
  const [a, b, c] = path;
  if (path.length === 1 && a === "quotes") return agentJson(await createQuote(body, ctx), 201);
  if (path.length === 3 && a === "quotes" && c === "negotiate") return agentJson(await negotiateQuote({ ...body, quoteRef: b }, ctx));
  if (path.length === 3 && a === "quotes" && c === "book") return agentJson(await bookQuote({ ...body, quoteRef: b }, ctx), 201);
  if (path.length === 1 && a === "enquiries") return agentJson(await submitEnquiry(body, ctx), 201);
  throw new CommerceError("Unknown endpoint. See /api/agent/v1/openapi.json", 404, "not_found");
}

const wrap = (fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) => async (req: NextRequest, ctx: Ctx) => {
  if (rateLimited(req, "agent", 240)) return agentJson({ error: { code: "rate_limited", message: "Too many requests" } }, 429, { "Retry-After": "60" });
  try {
    return await fn(req, ctx);
  } catch (e) {
    return agentError(e);
  }
};

export const GET = wrap(_GET);
export const POST = wrap(_POST);
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
