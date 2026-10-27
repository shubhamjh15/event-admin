import { getEvents, getSettings, pageMetadata } from "@/lib/data";
import { sized } from "@/lib/img";
import { BookingForm } from "@/components/forms";

export const generateMetadata = () => pageMetadata("book", "/book");

type Props = { searchParams: Promise<{ package?: string; type?: string }> };

export default async function BookPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [s, events] = await Promise.all([getSettings(), getEvents()]);
  const selected = events.find((e) => e.slug === sp.package);
  const perks = [
    ["Free consultation", "No obligation — just ideas, honesty and a plan."],
    ["Lower than online", s.priceBadge],
    ["Licensed · Bonded · Insured", `Trusted since ${s.since}.`],
    ["Pay your way", `We accept ${s.paymentMethods.join(", ")}.`],
  ];
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="relative min-h-[560px] overflow-hidden bg-ink text-white">
        <img src={sized(selected?.heroImage || s.heroPoster, 1600, 85)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/40" />
        <div className="relative flex h-full flex-col justify-end px-5 pb-12 pt-36 sm:px-8 lg:px-12 lg:pb-16">
          <p className="label text-white/70">Booking & appointments</p>
          <h1 className="display mt-6 text-5xl md:text-7xl">
            {selected ? <>Book <em className="serif-i text-marigold">{selected.title}</em></> : <>Reserve your <em className="serif-i text-marigold">celebration.</em></>}
          </h1>
          <dl className="mt-12 grid gap-px border-t border-white/25 sm:grid-cols-2">
            {perks.map(([k, v]) => (
              <div key={k} className="border-b border-white/25 py-5 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
                <dt className="font-display text-xl">{k}</dt>
                <dd className="mt-1 text-sm text-white/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="px-5 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-[140px]">
        <div className="mx-auto max-w-xl">
          <p className="mb-6 text-ink-mute">Request a booking for any event package, or schedule a free consultation with a senior planner.</p>
          <BookingForm
            events={events.map((e) => ({ slug: e.slug, title: e.title }))}
            payments={s.paymentMethods}
            defaultPackage={sp.package}
            defaultKind={sp.type === "appointment" ? "appointment" : "booking"}
          />
        </div>
      </div>
    </section>
  );
}
