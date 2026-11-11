import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const disallow = ["/admin", "/api/", "/q/"];
  // AI search and assistant crawlers are welcome, including the agent discovery files.
  const agentAllow = ["/", "/llms.txt", "/.well-known/", "/api/agent/v1/openapi.json"];
  const aiBots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "Google-Extended", "Googlebot", "PerplexityBot", "Perplexity-User", "Applebot-Extended", "Bingbot", "CCBot"];
  return {
    rules: [
      { userAgent: aiBots, allow: agentAllow, disallow },
      { userAgent: "*", allow: ["/", "/llms.txt", "/.well-known/"], disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
