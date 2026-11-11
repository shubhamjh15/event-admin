import "server-only";
import { getSettings } from "../data";
import { SITE_URL } from "./engine";
import { toolMap } from "./tools";

const schema = (tool: string, omit: string[] = []) => {
  const s = toolMap[tool].inputSchema;
  const properties = Object.fromEntries(Object.entries(s.properties || {}).filter(([k]) => !omit.includes(k)));
  const required = (s.required || []).filter((k: string) => !omit.includes(k));
  return { type: "object", properties, ...(required.length ? { required } : {}) };
};

// GPT Actions cap operation descriptions at 300 characters.
const op = (tool: string) => {
  const d = toolMap[tool].description;
  return { summary: toolMap[tool].title, description: d.length > 300 ? d.slice(0, 297).replace(/\s+\S*$/, "") + "…" : d };
};
const ok = (description: string) => ({ description, content: { "application/json": { schema: { type: "object", additionalProperties: true } } } });
const errors = {
  "400": { $ref: "#/components/responses/Error" },
  "404": { $ref: "#/components/responses/Error" },
  "409": { $ref: "#/components/responses/Error" },
  "429": { $ref: "#/components/responses/Error" },
};
const refParam = { name: "ref", in: "path", required: true, description: "Quote / booking reference, e.g. LQ-7K2M9QXA", schema: { type: "string" } };

export async function openApiSpec() {
  const s = await getSettings().catch(() => null);
  const name = s?.siteName || "Lit Concierge";
  return {
    openapi: "3.1.0",
    info: {
      title: `${name} Agent API`,
      version: "1.0.0",
      description: `Search, quote, negotiate and book luxury events with ${name} (in business since ${s?.since || "1989"}; licensed, bonded and insured). Always show the customer the final total and get explicit approval before booking, then give them the returned bookOnWhatsAppUrl to finish with a planner on WhatsApp. No payment is taken through the API. The same capabilities are available over MCP at ${SITE_URL()}/api/mcp.`,
      contact: { name, email: s?.email, url: SITE_URL() },
    },
    servers: [{ url: `${SITE_URL()}/api/agent/v1` }],
    paths: {
      "/business": { get: { operationId: "getBusinessInfo", ...op("get_business_info"), responses: { "200": ok("Business profile and booking terms") } } },
      "/packages": {
        get: {
          operationId: "searchPackages",
          ...op("search_packages"),
          parameters: Object.entries(toolMap.search_packages.inputSchema.properties).map(([k, v]: [string, any]) => ({ name: k, in: "query", required: false, description: v.description, schema: { type: v.type } })),
          responses: { "200": ok("Matching packages"), ...errors },
        },
      },
      "/packages/{slug}": {
        get: {
          operationId: "getPackage", ...op("get_package"),
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": ok("Package details"), ...errors },
        },
      },
      "/quotes": {
        post: {
          operationId: "createQuote", ...op("create_quote"),
          requestBody: { required: true, content: { "application/json": { schema: schema("create_quote") } } },
          responses: { "201": ok("Quote created"), ...errors },
        },
      },
      "/quotes/{ref}": { get: { operationId: "getQuote", ...op("get_quote"), parameters: [refParam], responses: { "200": ok("Quote"), ...errors } } },
      "/quotes/{ref}/negotiate": {
        post: {
          operationId: "negotiateQuote", ...op("negotiate_quote"), parameters: [refParam],
          requestBody: { required: true, content: { "application/json": { schema: schema("negotiate_quote", ["quoteRef"]) } } },
          responses: { "200": ok("Negotiation outcome and updated quote"), ...errors },
        },
      },
      "/quotes/{ref}/book": {
        post: {
          operationId: "bookQuote", ...op("book_quote"), parameters: [refParam],
          requestBody: { required: true, content: { "application/json": { schema: schema("book_quote", ["quoteRef"]) } } },
          responses: { "201": ok("Price locked, with a WhatsApp link to finish booking"), ...errors },
          "x-openai-isConsequential": true,
        },
      },
      "/bookings/{ref}": {
        get: {
          operationId: "getBookingStatus", ...op("get_booking_status"),
          parameters: [refParam, { name: "email", in: "query", required: true, description: "Customer email used for the booking", schema: { type: "string" } }],
          responses: { "200": ok("Booking status"), ...errors },
        },
      },
      "/enquiries": {
        post: {
          operationId: "submitEnquiry", ...op("submit_enquiry"),
          requestBody: { required: true, content: { "application/json": { schema: schema("submit_enquiry") } } },
          responses: { "201": ok("Enquiry received"), ...errors },
          "x-openai-isConsequential": true,
        },
      },
    },
    components: {
      responses: {
        Error: {
          description: "Error with a machine-readable code and a human-readable message to relay to the customer",
          content: { "application/json": { schema: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } } } },
        },
      },
    },
  };
}
