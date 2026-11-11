import "server-only";
import {
  bookQuote, bookingStatus, businessInfo, createQuote, getQuote, negotiateQuote, packageDetail, searchPackages, submitEnquiry, type Ctx,
} from "./engine";

/**
 * One definition per capability, consumed by the MCP server (tools/list + tools/call)
 * and mirrored by the REST endpoints documented in /api/agent/v1/openapi.json.
 */
export type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, any>;
  annotations: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  run: (args: any, ctx: Ctx) => Promise<unknown>;
};

const str = (description: string, extra: object = {}) => ({ type: "string", description, ...extra });
const int = (description: string, extra: object = {}) => ({ type: "integer", description, ...extra });
const quoteRef = str("Quote reference returned by create_quote, e.g. LQ-7K2M9QXA", { pattern: "^LQ-[A-Za-z0-9]{8}$" });

export const tools: Tool[] = [
  {
    name: "get_business_info",
    title: "About Lit Concierge",
    description:
      "Who Lit Concierge is (luxury event & travel concierge, in business since 1989, licensed, bonded and insured), contact details, accepted payment methods, booking terms (deposit, quote validity, tax), event categories and services. Call this first if you need context or terms.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: () => businessInfo(),
  },
  {
    name: "search_packages",
    title: "Search event packages",
    description:
      "Search bookable event packages: weddings, destination weddings, corporate meetings, incentive trips, sales trainings, concerts, birthdays, family reunions, group travel, cruises and more. Returns 'from' prices, price unit (flat, per-guest or per-day), guest capacity and inclusions. Use create_quote for an exact price.",
    inputSchema: {
      type: "object",
      properties: {
        query: str("Free-text search, e.g. 'beach wedding', 'Maldives incentive', 'palace'"),
        category: str("Category slug or name, e.g. 'destination-weddings', 'incentives' (see get_business_info)"),
        destination: str("City or country, e.g. 'Jaipur', 'Dubai', 'Italy'"),
        guests: int("Expected number of guests", { minimum: 1 }),
        maxBudget: { type: "number", description: "Customer's maximum total budget including tax, in the site currency (INR)", minimum: 0 },
        limit: int("Max results (default 10, max 30)", { minimum: 1, maximum: 30 }),
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (a) => searchPackages(a || {}),
  },
  {
    name: "get_package",
    title: "Get package details",
    description: "Full details of one package: description, day-by-day itinerary, inclusions, capacity, pricing basis and photos.",
    inputSchema: { type: "object", properties: { slug: str("Package slug from search_packages") }, required: ["slug"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (a) => packageDetail(String(a?.slug || "")),
  },
  {
    name: "create_quote",
    title: "Get a bookable quote",
    description:
      "Create a binding, itemised quote for a package on a date for a number of guests. Group-size and early-booking discounts are applied automatically, complimentary extras are included, and tax and deposit are shown. Returns a quoteRef used to negotiate, book or share a review-and-pay link with the customer. Quotes are valid for a limited time (see expiresAt).",
    inputSchema: {
      type: "object",
      properties: {
        packageSlug: str("Package slug from search_packages"),
        eventDate: str("Event start date, YYYY-MM-DD (at least 7 days from today)", { format: "date" }),
        guests: int("Number of guests", { minimum: 1 }),
        days: int("Number of days — only for packages priced per day", { minimum: 1, maximum: 30 }),
        requirements: str("Anything the planner should know: theme, dietary needs, rooms, special requests"),
        customerName: str("Customer name, if known"),
        customerEmail: str("Customer email, if known", { format: "email" }),
      },
      required: ["packageSlug", "eventDate", "guests"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: (a, ctx) => createQuote(a || {}, ctx),
  },
  {
    name: "get_quote",
    title: "Get a quote",
    description: "Current state of a quote: line items, price, savings, complimentary extras, negotiation history, rounds left, status and expiry.",
    inputSchema: { type: "object", properties: { quoteRef }, required: ["quoteRef"], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (a) => getQuote(a?.quoteRef),
  },
  {
    name: "negotiate_quote",
    title: "Negotiate a quote",
    description:
      "Make a price offer on a quote on the customer's behalf. Offers are a total including tax. The response is 'accepted' (quote updated to your price), 'countered' (we propose a new price) or 'final' (best and final price). A limited number of rounds is allowed. If the customer has a lower like-for-like quote elsewhere, pass competitorPrice (total incl. tax) and competitorSource — our price promise beats it by 1% where possible, subject to verification.",
    inputSchema: {
      type: "object",
      properties: {
        quoteRef,
        offerTotal: { type: "number", description: "Proposed total including tax, in the quote currency", exclusiveMinimum: 0 },
        competitorPrice: { type: "number", description: "A competing like-for-like total including tax, if any", exclusiveMinimum: 0 },
        competitorSource: str("Where the competing price comes from (company / URL)"),
        message: str("Optional note for the planner, e.g. budget constraints or flexibility on dates"),
      },
      required: ["quoteRef"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    run: (a, ctx) => negotiateQuote(a || {}, ctx),
  },
  {
    name: "book_quote",
    title: "Book (purchase) a quote",
    description:
      "Purchase a quote at its current price for the customer. Only call after showing the customer the total, deposit, date, guests and package and receiving their explicit approval — then set customerConfirmed to true. Places the booking, emails the customer a confirmation, and returns a secure checkout link to pay the deposit (cards, UPI, net banking) or offline payment instructions.",
    inputSchema: {
      type: "object",
      properties: {
        quoteRef,
        name: str("Customer's full name"),
        email: str("Customer's email", { format: "email" }),
        phone: str("Customer's phone with country code, e.g. +91 98765 43210"),
        paymentMethod: str("'Online' (secure payment link) or an accepted offline method from get_business_info, e.g. 'Bank Transfer'"),
        notes: str("Additional notes for the planner"),
        customerConfirmed: { type: "boolean", description: "Must be true: the customer has reviewed and approved this purchase" },
      },
      required: ["quoteRef", "name", "email", "phone", "customerConfirmed"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    run: (a, ctx) => bookQuote(a || {}, ctx),
  },
  {
    name: "get_booking_status",
    title: "Check a booking",
    description: "Status of a booking and its payment, with the checkout link if the deposit is still due. Requires the booking reference and the customer's email.",
    inputSchema: {
      type: "object",
      properties: { quoteRef: { ...quoteRef, description: "Booking reference (same as the quote reference)" }, email: str("Customer email used for the booking", { format: "email" }) },
      required: ["quoteRef", "email"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: (a) => bookingStatus(a || {}),
  },
  {
    name: "submit_enquiry",
    title: "Request a bespoke proposal",
    description:
      "For anything not covered by a package (bespoke events, larger groups, price-on-request packages, services like private jets, yachts, villas, security or sponsorship): send the customer's brief to a senior planner, who replies within one business day.",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Customer's full name"),
        email: str("Customer's email", { format: "email" }),
        phone: str("Customer's phone with country code"),
        eventType: str("Occasion, e.g. 'Destination wedding', 'Product launch'"),
        eventDate: str("Date or date range"),
        guests: int("Approximate guest count", { minimum: 1 }),
        budget: str("Budget, e.g. '₹50 lakh' or '$100k'"),
        destination: str("Preferred destination(s)"),
        message: str("The brief: what the customer wants"),
      },
      required: ["name", "email", "phone", "message"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    run: (a, ctx) => submitEnquiry(a || {}, ctx),
  },
];

export const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
