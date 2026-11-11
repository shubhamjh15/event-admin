import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSettings, getEvents, buildMetadata } from "@/lib/data";
import { SITE_URL, commerceConfig, money } from "@/lib/commerce/engine";
import { MCP_PATH, OPENAPI_PATH } from "@/lib/commerce/discovery";
import { CopyField } from "@/components/copy-field";

export const metadata: Metadata = buildMetadata({
  title: "Book with your AI assistant — Lit Concierge",
  description: "Ask Claude, ChatGPT or Gemini to find, price, negotiate and book your event with Lit Concierge. Connect our booking server in one step.",
  path: "/ai",
});

const pad = (n: number) => String(n).padStart(2, "0");

export default async function AiPage() {
  const [s, events] = await Promise.all([getSettings(), getEvents()]);
  const cfg = commerceConfig(s);
  const mcp = `${SITE_URL()}${MCP_PATH}`;
  const openapi = `${SITE_URL()}${OPENAPI_PATH}`;
  const sample = events.find((e: any) => /jaipur/i.test(e.destination || "")) || events[0];

  const steps = [
    ["Ask", "Tell your assistant what you're celebrating, where, when and for how many. It searches our live packages and prices."],
    ["Quote", "It gets an exact, itemised price from us, with group and early-booking savings and complimentary extras applied automatically."],
    ["Negotiate", `It can ask for a better price on your behalf — up to ${cfg.maxRounds} rounds — and show us a lower like-for-like quote for us to beat.`],
    ["Book", "Once you approve the total, it books for you. You pay the deposit on our secure page — never in a chat."],
  ];
  const clients = [
    ["Claude", "Settings → Connectors → Add custom connector. Paste the server URL and save. Then ask Claude to plan your event."],
    ["ChatGPT", "Turn on Developer mode in ChatGPT's app settings, then create a connector with the server URL. Building a custom GPT? Import our OpenAPI spec under Actions."],
    ["Gemini & others", "Any assistant or agent framework that supports MCP over HTTP (Gemini CLI, Cursor, VS Code, LangChain…) can add the server URL. Others can use the REST API."],
  ];
  const promises = [
    ["Prices you can trust", "Every price is calculated by our system and held in writing on a quote page. An assistant can't invent a discount."],
    ["You stay in control", "Nothing is booked until you've seen the total and deposit and said yes."],
    ["Card details stay private", "Payment happens on our secure checkout (cards, UPI, net banking). Your assistant never sees card numbers."],
    [`Since ${s.since}`, "Licensed, bonded and insured. A senior planner calls you within 24 hours of every booking."],
  ];

  return (
    <>
      <section className="bg-ink pb-20 pt-[140px] text-paper md:pb-28 md:pt-[180px]">
        <div className="wrap grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-8">
            <p className="label text-white/55">New · Agent booking</p>
            <h1 className="display mt-6 text-[clamp(3rem,8vw,7.5rem)]">
              Let your AI <em className="serif-i text-marigold">book the party.</em>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
              Claude, ChatGPT and Gemini can now search our packages, get you our best price, negotiate it down and book — directly with {s.siteName}, the way you'd ask a friend.
            </p>
          </div>
          <div className="min-w-0 lg:col-span-4">
            <p className="label mb-3 text-[10px] text-white/50">Booking server (MCP)</p>
            <CopyField value={mcp} tone="dark" />
            <p className="mt-3 text-sm text-white/55">No sign-up or API key needed.</p>
          </div>
        </div>
      </section>

      <section className="wrap py-20 md:py-28">
        <div className="mb-12 flex items-center gap-4 text-ink-mute"><h2 className="label">How it works</h2><span className="h-px flex-1 bg-ink/15" /></div>
        <ol className="grid border-t border-ink/15 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className={`border-b border-ink/15 py-10 md:border-b-0 ${i ? "md:border-l md:pl-8" : ""} md:pr-8`}>
              <p className="font-display text-5xl italic text-rani">{pad(i + 1)}</p>
              <h3 className="display mt-6 text-3xl">{t}</h3>
              <p className="mt-3 leading-relaxed text-ink-mute">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-ink/15 bg-paper-2 py-20 md:py-28">
        <div className="wrap grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-5">
            <h2 className="display text-5xl md:text-6xl">Connect in <em className="serif-i text-peacock">one step.</em></h2>
            <p className="mt-6 max-w-md leading-relaxed text-ink-mute">Add our booking server to your assistant once. After that, just talk.</p>
            <div className="mt-10 space-y-6">
              <div><p className="field-label mb-2">MCP server URL</p><CopyField value={mcp} /></div>
              <div><p className="field-label mb-2">OpenAPI spec (GPT Actions, agent frameworks)</p><CopyField value={openapi} /></div>
            </div>
          </div>
          <ol className="min-w-0 border-t border-ink/15 lg:col-span-7">
            {clients.map(([n, d]) => (
              <li key={n} className="grid gap-3 border-b border-ink/15 py-8 sm:grid-cols-[11rem_1fr] sm:gap-8">
                <h3 className="font-display text-2xl">{n}</h3>
                <p className="leading-relaxed text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap grid grid-cols-1 gap-14 py-20 md:py-28 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="label text-ink-mute">Try asking</p>
          <blockquote className="display mt-6 text-3xl leading-snug md:text-[2.5rem]">
            “Find us a palace wedding in Jaipur for 200 guests next winter. Get {s.siteName}'s best price, try to bring it down, and book it if it's under ₹60 lakh.”
          </blockquote>
          {sample?.price && <p className="mt-6 text-sm text-ink-mute">{sample.title}: from {money(sample.price, cfg)}{String(sample.priceNote || "").replace(/starting from,?\s*/i, "").replace(/^(.+)$/, " $1")}.</p>}
        </div>
        <ul className="grid min-w-0 gap-px self-start border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:col-span-7">
          {promises.map(([t, d]) => (
            <li key={t} className="bg-paper p-8">
              <h3 className="font-display text-2xl">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-mute">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-rani py-16 text-white">
        <div className="wrap flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <h2 className="display text-4xl md:text-5xl">Prefer a human? <em className="serif-i">We're here too.</em></h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/book" className="btn-paper">Book directly</Link>
            <Link href="/contact" className="btn-outline-light">Enquire <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
