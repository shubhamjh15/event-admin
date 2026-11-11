import "server-only";
import { getCategories, getEvents, getSettings } from "../data";
import { SITE_URL, commerceConfig, money, priceUnit } from "./engine";
import { tools } from "./tools";

export const MCP_PATH = "/api/mcp";
export const OPENAPI_PATH = "/api/agent/v1/openapi.json";

/** MCP server card so registries and assistants can discover the endpoint and its tools. */
export async function serverCard() {
  const s = await getSettings();
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: { name: "lit-concierge", title: `${s.siteName} — events & travel`, version: "1.0.0" },
    description: `Search, quote, negotiate and book luxury events with ${s.siteName}, in business since ${s.since}.`,
    documentationUrl: `${SITE_URL()}/ai`,
    transport: { type: "streamable-http", endpoint: `${SITE_URL()}${MCP_PATH}` },
    authentication: { required: false },
    capabilities: { tools: { listChanged: false } },
    tools: tools.map((t) => ({ name: t.name, title: t.title, description: t.description })),
    openapi: `${SITE_URL()}${OPENAPI_PATH}`,
  };
}

/** llms.txt — a plain-language map of the business and how an AI assistant can buy from it. */
export async function llmsTxt() {
  const [s, events, cats] = await Promise.all([getSettings(), getEvents(), getCategories()]);
  const cfg = commerceConfig(s);
  const site = SITE_URL();
  const unit = (e: any) => ({ "per-guest": " per guest", "per-day": " per day", flat: "" })[priceUnit(e)];
  const byCat = cats.map((c: any) => ({ c, list: events.filter((e: any) => e.category === c.slug) })).filter((x: any) => x.list.length);
  return `# ${s.siteName}

> ${s.tagline}. Luxury event and travel concierge in business since ${s.since} — licensed, bonded and insured. Weddings, destination weddings, corporate meetings, incentive trips, sales trainings, concerts, celebrations, group travel and cruises worldwide. ${s.priceBadge}.

## For AI assistants: buy on behalf of your user

${cfg.enabled ? `You can search packages, get an exact itemised quote, negotiate the price and book. Booking locks the price and gives the user a WhatsApp link that sends the booking straight to a planner.

- MCP server (Streamable HTTP, no auth): ${site}${MCP_PATH}
- REST API (OpenAPI 3.1): ${site}${OPENAPI_PATH}
- Human guide: ${site}/ai

Flow: search_packages → create_quote (package, date, guests) → optional negotiate_quote (offer a total incl. tax; up to ${cfg.maxRounds} rounds; competing quotes are beaten by 1% where possible) → show the user the total and get approval → book_quote with customerConfirmed: true → give the user the bookOnWhatsAppUrl to tap. Payment is arranged with the planner, never in chat.

Terms: prices in ${cfg.currency}; ${cfg.taxLabel} ${cfg.taxPct}% added; quotes are held for ${cfg.validityHours} hours. Group-size and early-booking discounts and complimentary extras are applied automatically.` : "Online quoting is currently paused. Please use the enquiry form or contact details below."}

## Packages
${byCat.map(({ c, list }: any) => `
### ${c.name}
${list.map((e: any) => `- [${e.title}](${site}/events/${e.slug}): ${e.summary || ""} ${e.destination ? `${e.destination}.` : ""} ${e.duration ? `${e.duration}.` : ""} ${e.guests ? `${e.guests}.` : ""} ${e.price ? `From ${money(e.price, cfg)}${unit(e)}.` : "Price on request."} (slug: ${e.slug})`.replace(/\s+/g, " ").trim()).join("\n")}`).join("\n")}

## Pages
- [Events](${site}/events)
- [Services](${site}/services): planning, rooming, budgeting, price negotiation (hotels, jets, villas, yachts, venues, AV, transport, flights), VIP concierge, security, event insurance
- [About](${site}/about)
- [Client stories](${site}/testimonials)
- [Enquire](${site}/contact)
- [Book](${site}/book)

## Contact
- Phone: ${s.phone}
- WhatsApp: ${s.whatsapp}
- Email: ${s.email}
- Address: ${s.address}
- Hours: ${s.hours}
`;
}
