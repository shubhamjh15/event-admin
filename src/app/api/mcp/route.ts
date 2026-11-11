import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/api";
import { getSettings } from "@/lib/data";
import { CommerceError } from "@/lib/commerce/engine";
import { tools, toolMap } from "@/lib/commerce/tools";
import { CORS, agentName } from "@/lib/commerce/http";

/**
 * Model Context Protocol server (Streamable HTTP transport, stateless JSON responses).
 * Add https://<site>/api/mcp as a custom connector in Claude, ChatGPT (developer mode / apps),
 * Gemini, Cursor, etc. and the assistant can search, quote, negotiate and book.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPPORTED = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_VERSION = "1.0.0";
const WRITE_TOOLS = new Set(["create_quote", "negotiate_quote", "book_quote", "submit_enquiry"]);

type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };

const rpcResult = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id: RpcRequest["id"], code: number, message: string, data?: unknown) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } });

/** Session ids are stateless: they carry the client's name so later calls can be attributed in the admin. */
function makeSession(clientName?: string) {
  const name = (clientName || "").replace(/[^\w .\-()]/g, "").slice(0, 60);
  return `${crypto.randomBytes(9).toString("base64url")}.${Buffer.from(name).toString("base64url")}`;
}
function sessionClient(id: string | null) {
  if (!id) return undefined;
  try {
    return Buffer.from(id.split(".")[1] || "", "base64url").toString("utf8").replace(/[^\w .\-()]/g, "").slice(0, 60) || undefined;
  } catch {
    return undefined;
  }
}

async function instructions() {
  const s = await getSettings().catch(() => null);
  const name = s?.siteName || "Lit Concierge";
  return `${name} is a luxury event and travel concierge in business since ${s?.since || "1989"} — licensed, bonded and insured — planning weddings, destination weddings, corporate meetings, incentive trips, concerts and celebrations worldwide, at prices lower than online.

How to help a customer buy:
1. search_packages (and get_package) to find options that fit their occasion, destination, guests and budget.
2. create_quote with the package, date and guest count — you get an exact, itemised, bookable price with automatic discounts and complimentary extras.
3. Optionally negotiate_quote to try for a better price (limited rounds; offers are totals incl. tax). Mention competing quotes via competitorPrice.
4. Show the customer the final total, date and inclusions. Only after they explicitly approve, call book_quote with customerConfirmed: true.
5. Give the customer the bookOnWhatsAppUrl to tap: it opens WhatsApp with the booking pre-filled, and a planner confirms and arranges payment there. Never take payment details in chat.
For anything bespoke or not listed, use submit_enquiry. All prices are in ${s ? (s as any).currencyCode || "INR" : "INR"}.`;
}

async function handle(msg: RpcRequest, req: NextRequest, session: { id: string | null; client?: string }) {
  const id = msg.id;
  const isNotification = id === undefined || id === null;
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return isNotification ? null : rpcError(id, -32600, "Invalid Request");

  switch (msg.method) {
    case "initialize": {
      const requested = msg.params?.protocolVersion;
      const s = await getSettings().catch(() => null);
      session.client = msg.params?.clientInfo?.name ? `${msg.params.clientInfo.name}${msg.params.clientInfo.version ? ` ${msg.params.clientInfo.version}` : ""}` : undefined;
      session.id = makeSession(session.client);
      return rpcResult(id, {
        protocolVersion: SUPPORTED.includes(requested) ? requested : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "lit-concierge", title: `${s?.siteName || "Lit Concierge"} — events & travel`, version: SERVER_VERSION, websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined },
        instructions: await instructions(),
      });
    }
    case "ping":
      return isNotification ? null : rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: tools.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations: { title, ...annotations } })),
      });
    case "tools/call": {
      const name = msg.params?.name;
      const tool = toolMap[name];
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${name}`);
      if (WRITE_TOOLS.has(name) && rateLimited(req, "mcp-write", 30)) {
        return rpcResult(id, { isError: true, content: [{ type: "text", text: "Rate limit reached. Please wait a minute and try again." }] });
      }
      try {
        const result = await tool.run(msg.params?.arguments || {}, { channel: "mcp", agent: session.client || agentName(req) });
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result });
      } catch (e) {
        if (e instanceof CommerceError) {
          return rpcResult(id, { isError: true, content: [{ type: "text", text: JSON.stringify({ error: e.code, message: e.message }) }] });
        }
        console.error(`[mcp] ${name}`, e);
        return rpcResult(id, { isError: true, content: [{ type: "text", text: "Something went wrong on our side. Please try again shortly." }] });
      }
    }
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "resources/templates/list":
      return rpcResult(id, { resourceTemplates: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    default:
      if (isNotification) return null; // notifications/initialized, notifications/cancelled, …
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: NextRequest) {
  if (rateLimited(req, "mcp", 240)) {
    return NextResponse.json(rpcError(null, -32000, "Too many requests"), { status: 429, headers: { ...CORS, "Retry-After": "60" } });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }
  const sessionId = req.headers.get("mcp-session-id");
  const session = { id: sessionId, client: sessionClient(sessionId) };
  const batch = Array.isArray(body);
  const messages = (batch ? body : [body]) as RpcRequest[];
  if (!messages.length || messages.length > 20) return NextResponse.json(rpcError(null, -32600, "Invalid Request"), { status: 400, headers: CORS });

  const responses = (await Promise.all(messages.map((m) => handle(m && typeof m === "object" ? m : ({} as RpcRequest), req, session).catch((e) => {
    console.error("[mcp]", e);
    return rpcError(m?.id, -32603, "Internal error");
  })))).filter(Boolean);

  const headers: Record<string, string> = { ...CORS, "Cache-Control": "no-store" };
  if (session.id) headers["Mcp-Session-Id"] = session.id;
  // Only notifications / responses: acknowledge with 202 and no body, per the Streamable HTTP spec.
  if (!responses.length) return new NextResponse(null, { status: 202, headers });
  return NextResponse.json(batch ? responses : responses[0], { headers });
}

export async function GET() {
  // No server-initiated stream: this server is stateless and answers every request directly.
  return new NextResponse("This MCP endpoint uses Streamable HTTP. Send JSON-RPC requests with POST.", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS, DELETE" },
  });
}

export async function DELETE() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
