import "server-only";
import crypto from "crypto";
import { dbConnect } from "../db";
import { Booking, Enquiry, Quote } from "../models";
import { getCategories, getEvent, getEvents, getServices, getSettings, type SiteSettings } from "../data";
import { settings as defaults } from "../seed-data";
import { notifyBooking, notifyEnquiry } from "../notify";
import { paymentsEnabled } from "./payments";

/**
 * Agentic commerce core: everything an AI agent (Claude, ChatGPT, Gemini…) needs to search the
 * catalogue, get a binding quote, negotiate within admin-set limits and place a booking.
 * Shared by the MCP server (/api/mcp), the REST API (/api/agent/v1) and the human quote page (/q/[ref]).
 *
 * Prices are always computed and stored server-side; an agent can never set a price directly.
 * The negotiation floor is private and never returned.
 */

export class CommerceError extends Error {
  constructor(message: string, public status = 400, public code = "invalid_request") {
    super(message);
  }
}

export type Channel = "mcp" | "rest" | "web";
export type Ctx = { channel: Channel; agent?: string };

type Tier = { min: number; pct: number };

export const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : d);
const tiers = (v: unknown, d: Tier[]): Tier[] =>
  (Array.isArray(v) ? v : d)
    .map((t: any) => ({ min: Number(t?.min), pct: Number(t?.pct) }))
    .filter((t) => Number.isFinite(t.min) && Number.isFinite(t.pct) && t.pct > 0)
    .sort((a, b) => b.min - a.min);

export function commerceConfig(s: SiteSettings) {
  const x = s as any;
  return {
    enabled: x.agentCommerceEnabled !== false,
    currency: String(x.currencyCode || "INR").toUpperCase(),
    symbol: x.currency || "₹",
    maxDiscountPct: Math.min(60, Math.max(0, num(x.agentMaxDiscountPct, defaults.agentMaxDiscountPct))),
    depositPct: Math.min(100, Math.max(0, num(x.agentDepositPct, defaults.agentDepositPct))),
    validityHours: Math.min(24 * 30, Math.max(1, num(x.agentQuoteValidityHours, defaults.agentQuoteValidityHours))),
    maxRounds: Math.min(10, Math.max(0, num(x.agentMaxRounds, defaults.agentMaxRounds))),
    taxPct: Math.min(50, Math.max(0, num(x.agentTaxPct, defaults.agentTaxPct))),
    taxLabel: String(x.agentTaxLabel || "Tax"),
    volume: tiers(x.agentVolumeTiers, defaults.agentVolumeTiers),
    early: tiers(x.agentEarlyTiers, defaults.agentEarlyTiers),
    perks: (Array.isArray(x.agentPerks) ? x.agentPerks : defaults.agentPerks)
      .map((p: any) => ({ min: Number(p?.min) || 0, perk: String(p?.perk || "").trim() }))
      .filter((p: any) => p.perk),
    paymentInstructions: String(x.agentPaymentInstructions || "").trim(),
  };
}

async function loadConfig() {
  const s = await getSettings();
  const cfg = commerceConfig(s);
  if (!cfg.enabled) throw new CommerceError("Online quoting is paused at the moment. Please contact us directly.", 503, "commerce_disabled");
  return { s, cfg };
}

/** Friendly assistant name from an MCP client name or user agent, or null when it isn't a known assistant. */
export function assistantLabel(agent?: string | null): string | null {
  const a = String(agent || "").toLowerCase();
  const known: [RegExp, string][] = [
    [/claude|anthropic/, "Claude"], [/chatgpt|openai|gpt/, "ChatGPT"], [/gemini|google/, "Gemini"], [/perplexity/, "Perplexity"],
    [/copilot|microsoft/, "Copilot"], [/cursor/, "Cursor"], [/grok|xai/, "Grok"], [/meta-?ai|llama/, "Meta AI"],
  ];
  return known.find(([re]) => re.test(a))?.[1] ?? null;
}

export function money(n: number, cfg: { currency: string; symbol: string }) {
  return `${cfg.symbol}${Math.round(n).toLocaleString(cfg.currency === "INR" ? "en-IN" : "en-US")}`;
}

/** How a package's price multiplies. Admin can set it explicitly; otherwise inferred from the price note. */
export function priceUnit(e: any): "flat" | "per-guest" | "per-day" {
  if (["flat", "per-guest", "per-day"].includes(e?.priceUnit)) return e.priceUnit;
  const note = String(e?.priceNote || "").toLowerCase();
  if (/per (guest|delegate|attendee|person|pax|head)/.test(note)) return "per-guest";
  if (/per (day|night)/.test(note)) return "per-day";
  return "flat";
}

export function guestRange(e: any): { min?: number; max?: number } {
  const n = String(e?.guests || "").replace(/,/g, "").match(/\d+/g)?.map(Number) || [];
  if (!n.length) return {};
  return { min: Math.min(...n), max: n.length > 1 ? Math.max(...n) : undefined };
}

/** Round prices to a clean figure, always up so we never drop below a floor by rounding. */
function tidy(n: number) {
  const step = n >= 1_000_000 ? 1000 : n >= 100_000 ? 500 : n >= 10_000 ? 100 : 10;
  return Math.ceil(n / step) * step;
}

/** Agent-safe view of a package (no private negotiation settings). */
export function publicPackage(e: any, cfg: ReturnType<typeof commerceConfig>, catNames: Record<string, string> = {}) {
  const unit = priceUnit(e);
  const range = guestRange(e);
  return {
    slug: e.slug,
    title: e.title,
    category: e.category,
    categoryName: catNames[e.category] || e.category,
    summary: e.summary,
    destination: e.destination,
    duration: e.duration,
    guestRange: e.guests,
    minGuests: range.min ?? null,
    maxGuests: range.max ?? null,
    priceFrom: e.price ?? null,
    priceFromFormatted: e.price ? money(e.price, cfg) : "On request",
    priceUnit: unit,
    priceNote: e.priceNote,
    currency: cfg.currency,
    inclusions: e.inclusions || [],
    featured: !!e.featured,
    image: e.heroImage,
    url: `${SITE_URL()}/events/${e.slug}`,
    instantQuote: !!e.price,
  };
}

/* ---------------------------------- Catalogue ---------------------------------- */

const norm = (s: unknown) => String(s || "").toLowerCase();

export async function searchPackages(q: {
  query?: string; category?: string; destination?: string; guests?: number; maxBudget?: number; limit?: number;
}) {
  const { cfg } = await loadConfig();
  const [events, cats] = await Promise.all([getEvents(), getCategories()]);
  const catNames: Record<string, string> = Object.fromEntries(cats.map((c: any) => [c.slug, c.name]));
  const words = norm(q.query).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  const guests = q.guests && q.guests > 0 ? Math.floor(q.guests) : undefined;

  const scored = events
    .filter((e: any) => !q.category || e.category === q.category || norm(catNames[e.category]).includes(norm(q.category)))
    .filter((e: any) => !q.destination || norm(e.destination).includes(norm(q.destination)) || norm(e.destination).includes("any") || norm(e.destination).includes("your city") || norm(e.destination).includes("worldwide"))
    .map((e: any) => {
      const hay = norm([e.title, e.summary, e.destination, e.category, catNames[e.category], (e.inclusions || []).join(" "), e.description].join(" "));
      const score = words.length ? words.reduce((n, w) => n + (hay.includes(w) ? (norm(e.title).includes(w) ? 3 : 1) : 0), 0) : 1;
      const range = guestRange(e);
      const fitsGuests = !guests || ((range.min == null || guests >= range.min * 0.5) && (range.max == null || guests <= range.max));
      const unit = priceUnit(e);
      const estimate = e.price ? e.price * (unit === "per-guest" ? Math.max(guests || range.min || 1, range.min || 1) : 1) : undefined;
      return { e, score: score + (e.featured ? 0.5 : 0), fitsGuests, estimate };
    })
    .filter((r) => r.score > 0 && r.fitsGuests)
    // maxBudget is a total incl. tax; keep anything that could fit once discounts are applied.
    .filter((r) => !q.maxBudget || r.estimate == null || r.estimate * (1 - cfg.maxDiscountPct / 100) * (1 + cfg.taxPct / 100) <= q.maxBudget)
    .sort((a, b) => b.score - a.score);

  const limit = Math.min(30, Math.max(1, q.limit || 10));
  return {
    count: scored.length,
    currency: cfg.currency,
    packages: scored.slice(0, limit).map((r) => ({
      ...publicPackage(r.e, cfg, catNames),
      estimatedListPriceExTax: r.estimate ?? null,
    })),
    tip: "Call create_quote with a package slug, event date and guest count for an exact, bookable price including available discounts.",
  };
}

export async function packageDetail(slug: string) {
  const { cfg } = await loadConfig();
  const [e, cats] = await Promise.all([getEvent(slug), getCategories()]);
  if (!e) throw new CommerceError(`No package found with slug "${slug}". Use search_packages to find valid slugs.`, 404, "not_found");
  const catNames = Object.fromEntries(cats.map((c: any) => [c.slug, c.name]));
  return {
    ...publicPackage(e, cfg, catNames),
    description: String(e.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    itinerary: (e.itinerary || []).map((d: any) => ({ day: d.day, title: d.title, details: d.details })),
    gallery: e.gallery || [],
  };
}

export async function businessInfo() {
  const { s, cfg } = await loadConfig();
  const [cats, services] = await Promise.all([getCategories(), getServices()]);
  return {
    name: s.siteName,
    tagline: s.tagline,
    inBusinessSince: s.since,
    credentials: s.trustBadges,
    pricePromise: s.priceBadge,
    about: s.aboutShort,
    contact: { phone: s.phone, whatsapp: s.whatsapp, email: s.email, address: s.address, hours: s.hours },
    website: SITE_URL(),
    currency: cfg.currency,
    acceptedPayments: s.paymentMethods,
    onlinePayment: paymentsEnabled() ? "Cards, UPI and net banking via secure payment link" : "Not enabled — planner sends payment details",
    terms: {
      quoteValidityHours: cfg.validityHours,
      depositPercent: cfg.depositPct,
      tax: `${cfg.taxLabel} ${cfg.taxPct}% on the package price`,
      negotiation: `Agents may negotiate on a quote up to ${cfg.maxRounds} times. Volume and early-booking discounts are applied automatically.`,
      confirmation: "A booking is held once placed and confirmed when the deposit is received. A senior planner contacts the client within 24 hours.",
    },
    eventCategories: cats.map((c: any) => ({ slug: c.slug, name: c.name, tagline: c.tagline })),
    services: services.map((x: any) => ({ slug: x.slug, title: x.title, summary: x.summary })),
  };
}

/* ----------------------------------- Quotes ----------------------------------- */

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newRef() {
  const bytes = crypto.randomBytes(8);
  return "LQ-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

export function normaliseRef(ref: unknown) {
  const r = String(ref || "").trim().toUpperCase();
  if (!/^LQ-[A-Z0-9]{8}$/.test(r)) throw new CommerceError("That quote reference doesn't look right. It should look like LQ-XXXXXXXX.", 400, "invalid_ref");
  return r;
}

function parseDate(v: unknown) {
  const s = String(v || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new CommerceError("eventDate must be a date in YYYY-MM-DD format.", 400, "invalid_date");
  const d = new Date(s + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) throw new CommerceError("eventDate is not a valid date.", 400, "invalid_date");
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 7) throw new CommerceError("Online quotes need at least 7 days' notice. For anything sooner, please call us directly.", 400, "date_too_soon");
  if (days > 3 * 365) throw new CommerceError("We can quote events up to three years ahead.", 400, "date_too_far");
  return { iso: s, daysAhead: days };
}

/** Public quote view: no floor, no admin notes. */
export function quoteView(q: any, cfg: { currency: string; symbol: string }) {
  const expired = q.status === "open" && q.expiresAt && new Date(q.expiresAt).getTime() < Date.now();
  const status = expired ? "expired" : q.status;
  const roundsLeft = Math.max(0, (q.maxRounds ?? 0) - (q.rounds ?? 0));
  return {
    quoteRef: q.ref,
    status,
    package: { slug: q.eventPackage, title: q.eventTitle, url: `${SITE_URL()}/events/${q.eventPackage}` },
    eventDate: q.eventDate,
    guests: q.guests,
    days: q.days,
    currency: q.currency,
    lineItems: (q.lines || []).map((l: any) => ({ label: l.label, amount: l.amount, formatted: money(l.amount, cfg) })),
    listPriceExTax: q.listTotal,
    priceExTax: q.subtotal,
    savings: q.listTotal - q.subtotal,
    savingsFormatted: money(q.listTotal - q.subtotal, cfg),
    tax: { label: `${q.taxLabel} ${q.taxPct}%`, amount: q.tax },
    total: q.total,
    totalFormatted: money(q.total, cfg),
    depositDue: q.deposit,
    depositFormatted: money(q.deposit, cfg),
    depositPercent: q.depositPct,
    includes: q.inclusions,
    complimentary: q.perks,
    notes: q.notes,
    negotiation: {
      roundsUsed: q.rounds || 0,
      roundsLeft: status === "open" ? roundsLeft : 0,
      history: (q.history || []).map((h: any) => ({ at: h.at, offer: h.offer, response: h.response, priceAfter: h.priceAfter, message: h.message })),
    },
    expiresAt: q.expiresAt,
    reviewAndPayUrl: `${SITE_URL()}/q/${q.ref}`,
  };
}

function priceLines(q: { subtotal: number; listTotal: number; taxPct: number; depositPct: number }) {
  const tax = Math.round((q.subtotal * q.taxPct) / 100);
  const total = q.subtotal + tax;
  return { tax, total, deposit: Math.round((total * q.depositPct) / 100) };
}

export async function createQuote(
  input: { packageSlug?: string; eventDate?: string; guests?: number; days?: number; requirements?: string; customerName?: string; customerEmail?: string },
  ctx: Ctx,
) {
  const { cfg } = await loadConfig();
  const slug = String(input.packageSlug || "").trim();
  if (!slug) throw new CommerceError("packageSlug is required. Use search_packages to find one.", 400, "missing_package");
  const e = await getEvent(slug);
  if (!e) throw new CommerceError(`No package found with slug "${slug}".`, 404, "not_found");
  if (!e.price) {
    throw new CommerceError("This package is priced on request. Use submit_enquiry and a planner will send a tailored proposal within one business day.", 409, "price_on_request");
  }
  const date = parseDate(input.eventDate);
  const unit = priceUnit(e);
  const range = guestRange(e);
  const guests = Math.floor(Number(input.guests) || 0);
  if (guests < 1) throw new CommerceError("guests must be a positive number.", 400, "invalid_guests");
  if (range.max && guests > range.max) {
    throw new CommerceError(`This package hosts up to ${range.max} guests. For ${guests}, use submit_enquiry for a bespoke proposal.`, 409, "over_capacity");
  }
  const days = unit === "per-day" ? Math.min(30, Math.max(1, Math.floor(Number(input.days) || 1))) : undefined;

  const notes: string[] = [];
  const lines: { label: string; amount: number; kind: string }[] = [];
  let units = 1;
  let unitLabel = "package";
  if (unit === "per-guest") {
    units = Math.max(guests, range.min || 1);
    unitLabel = units === 1 ? "guest" : "guests";
    if (range.min && guests < range.min) notes.push(`Priced at the package minimum of ${range.min} guests.`);
  } else if (unit === "per-day") {
    units = days!;
    unitLabel = units === 1 ? "day" : "days";
  }
  const listTotal = e.price * units;
  lines.push({ label: unit === "flat" ? `${e.title}` : `${e.title} — ${money(e.price, cfg)} × ${units} ${unitLabel}`, amount: listTotal, kind: "base" });

  const floor = tidy(listTotal * (1 - (e.maxDiscountPct != null && e.maxDiscountPct !== "" ? Math.min(60, Math.max(0, Number(e.maxDiscountPct))) : cfg.maxDiscountPct) / 100));
  const effectiveFloor = Math.min(floor, listTotal);
  let subtotal = listTotal;
  const apply = (label: string, pct: number) => {
    const cut = Math.min(Math.round((listTotal * pct) / 100), subtotal - effectiveFloor);
    if (cut <= 0) return;
    subtotal -= cut;
    lines.push({ label, amount: -cut, kind: "discount" });
  };
  if (unit === "per-guest") {
    const v = cfg.volume.find((t) => guests >= t.min);
    if (v) apply(`Group rate (${v.min}+ guests) −${v.pct}%`, v.pct);
  }
  const early = cfg.early.find((t) => date.daysAhead >= t.min);
  if (early) apply(`Early booking (${early.min}+ days ahead) −${early.pct}%`, early.pct);

  const perks = cfg.perks.filter((p: any) => subtotal >= p.min).map((p: any) => p.perk);
  const { tax, total, deposit } = priceLines({ subtotal, listTotal, taxPct: cfg.taxPct, depositPct: cfg.depositPct });
  notes.push("Flights, visas and items not listed under 'includes' are quoted separately on request.");

  await dbConnect();
  let doc: any;
  for (let i = 0; i < 3 && !doc; i++) {
    try {
      doc = await Quote.create({
        ref: newRef(), status: "open", eventPackage: e.slug, eventTitle: e.title, eventDate: date.iso, guests, days, priceUnit: unit,
        currency: cfg.currency, lines, listTotal, subtotal, floor: effectiveFloor, taxPct: cfg.taxPct, taxLabel: cfg.taxLabel, tax, total,
        depositPct: cfg.depositPct, deposit, inclusions: e.inclusions || [], perks, notes, rounds: 0, maxRounds: cfg.maxRounds, history: [],
        requirements: String(input.requirements || "").slice(0, 2000), agent: ctx.agent?.slice(0, 200), channel: ctx.channel,
        customerName: String(input.customerName || "").slice(0, 120), customerEmail: String(input.customerEmail || "").slice(0, 200).toLowerCase(),
        expiresAt: new Date(Date.now() + cfg.validityHours * 3_600_000),
      });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
  }
  return {
    ...quoteView(doc.toObject(), cfg),
    nextSteps: [
      cfg.maxRounds > 0 ? `To ask for a better price, call negotiate_quote with an offer (total incl. tax). ${cfg.maxRounds} rounds allowed.` : "This price is final.",
      "To purchase, confirm the details with the customer, then call book_quote.",
      `The customer can also review and pay at ${SITE_URL()}/q/${doc.ref}`,
    ],
  };
}

async function loadQuote(ref: unknown) {
  const r = normaliseRef(ref);
  await dbConnect();
  const q: any = await Quote.findOne({ ref: r });
  if (!q) throw new CommerceError("No quote found with that reference.", 404, "not_found");
  return q;
}

export async function getQuote(ref: unknown) {
  const { cfg } = await loadConfig();
  const q = await loadQuote(ref);
  return quoteView(q.toObject(), cfg);
}

function assertOpen(q: any) {
  if (q.status === "booked") throw new CommerceError("This quote has already been booked. Use get_booking_status to check it.", 409, "already_booked");
  if (q.status !== "open") throw new CommerceError(`This quote is ${q.status}.`, 409, `quote_${q.status}`);
  if (q.expiresAt && new Date(q.expiresAt).getTime() < Date.now()) {
    throw new CommerceError("This quote has expired. Call create_quote again for a fresh price.", 410, "quote_expired");
  }
}

/**
 * Negotiation policy (deterministic, so agents get consistent answers):
 *  - Offers are compared ex-tax; the agent offers a total incl. tax.
 *  - Each round we concede part of the remaining gap to the private floor (40%, 60%, then all of it on the final round).
 *  - An offer at or above our counter is accepted at the offered price. We never go below the floor.
 *  - A verified-lower competitor price is beaten by 1% when the floor allows it (flagged for staff verification).
 */
export async function negotiateQuote(
  input: { quoteRef?: string; offerTotal?: number; competitorPrice?: number; competitorSource?: string; message?: string },
  ctx: Ctx,
) {
  const { cfg } = await loadConfig();
  const q = await loadQuote(input.quoteRef);
  assertOpen(q);
  const maxRounds = q.maxRounds ?? cfg.maxRounds;
  if (q.rounds >= maxRounds) {
    return { ...quoteView(q.toObject(), cfg), outcome: "final", message: `We've reached our best price of ${money(q.total, cfg)} including ${q.taxLabel}. This price is final; book_quote will lock it in.` };
  }
  const offer = Number(input.offerTotal);
  const competitor = input.competitorPrice != null && input.competitorPrice !== ("" as any) ? Number(input.competitorPrice) : undefined;
  if (!(offer > 0) && !(competitor && competitor > 0)) throw new CommerceError("Provide offerTotal (your proposed total including tax) and/or competitorPrice.", 400, "invalid_offer");

  const exTax = (v: number) => v / (1 + q.taxPct / 100);
  const current: number = q.subtotal;
  const floor: number = q.floor;
  const round = q.rounds + 1;
  const isFinal = round >= maxRounds;
  let response: "accepted" | "countered" | "final";
  let newSub = current;
  let message: string;

  if (competitor && competitor > 0 && exTax(competitor) < current) {
    const beat = tidy(exTax(competitor) * 0.99);
    if (beat >= floor) {
      newSub = Math.min(current, beat);
      response = "accepted";
      q.priceMatchClaim = true;
      message = `Our price promise: we've beaten that ${money(competitor, cfg)} quote by 1%. Like-for-like scope will be verified by your planner before final confirmation.`;
    } else {
      newSub = floor;
      response = "final";
      message = `We can't match ${money(competitor, cfg)} for the same scope and service level, but we've moved to our lowest possible price.`;
    }
  } else if (offer > 0 && exTax(offer) >= current) {
    response = "accepted";
    message = "That's at or above our current price, so the current price stands — no need to pay more.";
  } else {
    const offerSub = exTax(offer);
    const share = isFinal ? 1 : round === 1 ? 0.4 : 0.6;
    const counter = Math.max(floor, tidy(current - (current - floor) * share));
    if (offerSub >= counter) {
      newSub = Math.max(floor, Math.round(offerSub));
      newSub = Math.min(newSub, current);
      response = "accepted";
      message = "Offer accepted. The quote has been updated to your price.";
    } else {
      newSub = counter;
      response = isFinal || counter === floor ? "final" : "countered";
      message = response === "final"
        ? `That's below what we can do. Our best and final price is ${money(counter + Math.round((counter * q.taxPct) / 100), cfg)} including ${q.taxLabel}.`
        : `We can't go that low, but we can meet you at ${money(counter + Math.round((counter * q.taxPct) / 100), cfg)} including ${q.taxLabel}.`;
    }
  }

  if (newSub < current) {
    const cut = current - newSub;
    const existing = q.lines.find((l: any) => l.kind === "negotiated");
    if (existing) existing.amount -= cut;
    else q.lines.push({ label: "Negotiated discount", amount: -cut, kind: "negotiated" });
  }
  q.subtotal = newSub;
  Object.assign(q, priceLines({ subtotal: newSub, listTotal: q.listTotal, taxPct: q.taxPct, depositPct: q.depositPct }));
  q.rounds = response === "final" ? maxRounds : round;
  q.history.push({
    at: new Date(), offer: offer > 0 ? offer : undefined, competitorPrice: competitor, competitorSource: String(input.competitorSource || "").slice(0, 300) || undefined,
    response, priceAfter: q.total, message: [message, input.message ? `Agent note: ${String(input.message).slice(0, 500)}` : ""].filter(Boolean).join(" "),
  });
  if (ctx.agent && !q.agent) q.agent = ctx.agent.slice(0, 200);
  q.markModified("lines");
  await q.save();
  return { ...quoteView(q.toObject(), cfg), outcome: response, message };
}

/* ---------------------------------- Bookings ---------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function bookQuote(
  input: { quoteRef?: string; name?: string; email?: string; phone?: string; paymentMethod?: string; notes?: string; customerConfirmed?: boolean },
  ctx: Ctx,
) {
  const { s, cfg } = await loadConfig();
  if (input.customerConfirmed !== true) {
    throw new CommerceError("Before booking, show the customer the total, deposit and event details and get their explicit approval, then call again with customerConfirmed: true.", 400, "confirmation_required");
  }
  const name = String(input.name || "").trim().slice(0, 120);
  const email = String(input.email || "").trim().toLowerCase().slice(0, 200);
  const phone = String(input.phone || "").trim().slice(0, 40);
  if (name.length < 2) throw new CommerceError("The customer's full name is required.", 400, "missing_name");
  if (!EMAIL.test(email)) throw new CommerceError("A valid customer email is required.", 400, "invalid_email");
  if ((phone.match(/\d/g) || []).length < 6) throw new CommerceError("A valid customer phone number (with country code) is required.", 400, "invalid_phone");
  const methods: string[] = s.paymentMethods || [];
  const online = paymentsEnabled();
  let paymentMethod = String(input.paymentMethod || "").trim();
  if (paymentMethod && !/^online$/i.test(paymentMethod) && !methods.some((m) => m.toLowerCase() === paymentMethod.toLowerCase())) {
    throw new CommerceError(`paymentMethod must be one of: ${[online ? "Online" : null, ...methods].filter(Boolean).join(", ")}.`, 400, "invalid_payment_method");
  }
  if (!paymentMethod) paymentMethod = online ? "Online" : methods[0] || "Bank Transfer";
  if (/^online$/i.test(paymentMethod)) paymentMethod = online ? "Online" : "Bank Transfer";

  await dbConnect();
  const ref = normaliseRef(input.quoteRef);
  // Atomically claim the quote so two concurrent calls can't double-book it.
  const q: any = await Quote.findOneAndUpdate(
    { ref, status: "open", expiresAt: { $gt: new Date() } },
    { $set: { status: "booked", customerName: name, customerEmail: email } },
    { new: true },
  );
  if (!q) {
    const existing: any = await Quote.findOne({ ref }).lean();
    if (!existing) throw new CommerceError("No quote found with that reference.", 404, "not_found");
    if (existing.status === "booked" && existing.customerEmail === email) return bookingStatus({ quoteRef: ref, email });
    assertOpen(existing);
    throw new CommerceError("This quote can no longer be booked.", 409, "quote_unavailable");
  }

  let booking: any;
  try {
    booking = await Booking.create({
      kind: "booking", name, email, phone, eventPackage: q.eventPackage, eventDate: q.eventDate, guests: String(q.guests), paymentMethod,
      message: [input.notes, q.requirements].filter(Boolean).join("\n\n").slice(0, 3000) || undefined,
      source: ctx.channel === "web" ? "quote-page" : "ai-agent", agent: (ctx.agent || q.agent || "").slice(0, 200) || undefined,
      quoteRef: q.ref, currency: q.currency, amount: q.total, deposit: q.deposit, paymentStatus: "unpaid", status: "pending",
    });
  } catch (err) {
    await Quote.updateOne({ _id: q._id }, { $set: { status: "open" } }).catch(() => {});
    throw err;
  }
  q.bookingId = String(booking._id);
  await q.save();

  const log = await notifyBooking({
    kind: "booking", name, email, phone, eventPackage: q.eventPackage, eventDate: q.eventDate, guests: String(q.guests), paymentMethod,
    message: booking.message, _id: booking._id, quoteRef: q.ref, amount: money(q.total, cfg), deposit: money(q.deposit, cfg),
    source: booking.source, agent: booking.agent, payUrl: `${SITE_URL()}/q/${q.ref}`,
  }).catch((e) => `Email error: ${e?.message || e}`);
  await Booking.updateOne({ _id: booking._id }, { $set: { emailLog: log } }).catch(() => {});

  return {
    ...(await bookingStatus({ quoteRef: q.ref, email })),
    message: `Booking placed and held for ${name}. A confirmation email has been sent to ${email}.`,
  };
}

export async function bookingStatus(input: { quoteRef?: string; email?: string }) {
  const { s, cfg } = await loadConfig();
  const ref = normaliseRef(input.quoteRef);
  const email = String(input.email || "").trim().toLowerCase();
  await dbConnect();
  const b: any = await Booking.findOne({ quoteRef: ref }).sort({ createdAt: -1 }).lean();
  // Same response for "no booking" and "wrong email" so references can't be probed for personal data.
  if (!b || !email || b.email !== email) throw new CommerceError("No booking found for that reference and email.", 404, "not_found");
  const paid = ["deposit-paid", "paid"].includes(b.paymentStatus);
  const online = paymentsEnabled() && b.paymentMethod === "Online";
  return {
    bookingRef: ref,
    status: b.status,
    paymentStatus: b.paymentStatus,
    package: b.eventPackage,
    eventDate: b.eventDate,
    guests: b.guests,
    currency: b.currency,
    total: b.amount,
    totalFormatted: b.amount != null ? money(b.amount, cfg) : undefined,
    depositDue: paid ? 0 : b.deposit,
    depositFormatted: b.deposit != null ? money(b.deposit, cfg) : undefined,
    paidAmount: b.paidAmount || 0,
    paymentMethod: b.paymentMethod,
    payment: paid
      ? { instructions: "Deposit received — the booking is confirmed." }
      : online
        ? { checkoutUrl: `${SITE_URL()}/q/${ref}`, instructions: "Share this secure link with the customer to pay the deposit by card, UPI or net banking. The booking is confirmed automatically once paid." }
        : {
            checkoutUrl: `${SITE_URL()}/q/${ref}`,
            instructions: cfg.paymentInstructions || `The planner will share how to pay${b.paymentMethod ? ` by ${b.paymentMethod.toLowerCase()}` : ""} within 24 hours.${paymentsEnabled() ? " Online payment is also available at the checkout link." : ""} Questions: ${s.phone} · ${s.email}.`,
          },
    nextSteps: paid
      ? ["Your planner will be in touch within 24 hours to begin planning."]
      : ["Pay the deposit to confirm.", "A senior planner will contact the customer within 24 hours to confirm availability and details."],
  };
}

export async function submitEnquiry(
  input: { name?: string; email?: string; phone?: string; eventType?: string; eventDate?: string; guests?: number | string; budget?: string; destination?: string; message?: string },
  ctx: Ctx,
) {
  await loadConfig();
  const data = {
    name: String(input.name || "").trim().slice(0, 120),
    email: String(input.email || "").trim().toLowerCase().slice(0, 200),
    phone: String(input.phone || "").trim().slice(0, 40),
    eventType: String(input.eventType || "").slice(0, 200),
    eventDate: String(input.eventDate || "").slice(0, 40),
    guests: input.guests != null ? String(input.guests).slice(0, 40) : "",
    budget: String(input.budget || "").slice(0, 120),
    destination: String(input.destination || "").slice(0, 200),
    message: String(input.message || "").slice(0, 3000),
    source: `AI agent${ctx.agent ? ` (${ctx.agent.slice(0, 80)})` : ""}`,
  };
  if (data.name.length < 2) throw new CommerceError("The customer's name is required.", 400, "missing_name");
  if (!EMAIL.test(data.email)) throw new CommerceError("A valid customer email is required.", 400, "invalid_email");
  if ((data.phone.match(/\d/g) || []).length < 6) throw new CommerceError("A valid phone number is required.", 400, "invalid_phone");
  await dbConnect();
  const doc: any = await Enquiry.create({ ...data, status: "new" });
  const log = await notifyEnquiry({ ...data, _id: doc._id }).catch((e) => `Email error: ${e?.message || e}`);
  await Enquiry.updateOne({ _id: doc._id }, { $set: { emailLog: log } }).catch(() => {});
  return { ok: true, enquiryId: String(doc._id), message: "Enquiry received. A senior planner will reply to the customer within one business day with a tailored proposal." };
}
