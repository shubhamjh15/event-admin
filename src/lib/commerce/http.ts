import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { CommerceError } from "./engine";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID, X-Agent-Name",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export function agentJson(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { ...CORS, "Cache-Control": "no-store", ...headers } });
}

export function agentError(e: unknown) {
  if (e instanceof CommerceError) return agentJson({ error: { code: e.code, message: e.message } }, e.status);
  console.error("[agent]", e);
  return agentJson({ error: { code: "server_error", message: "Something went wrong on our side. Please try again shortly." } }, 500);
}

/** Best-effort identification of the calling AI client, for the admin's records only. */
export function agentName(req: NextRequest, fallback?: string) {
  const explicit = req.headers.get("x-agent-name")?.trim();
  if (explicit) return explicit.slice(0, 120);
  if (fallback) return fallback.slice(0, 120);
  const ua = req.headers.get("user-agent") || "";
  const known = ua.match(/(Claude[\w-]*|ChatGPT[\w-]*|OpenAI[\w-]*|GPTBot|Gemini[\w-]*|Google-[\w-]+|Perplexity[\w-]*|Copilot[\w-]*|Anthropic[\w-]*)/i)?.[1];
  return (known || ua.split(" ")[0] || "unknown agent").slice(0, 120);
}
