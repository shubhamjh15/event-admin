import { getCategories, getFaqs, getSettings, pageMetadata } from "@/lib/data";
import { EnquiryForm } from "@/components/forms";
import { Faqs } from "@/components/interactive";
import { Reveal } from "@/components/reveal";

export const generateMetadata = () => pageMetadata("contact", "/contact");

type Props = { searchParams: Promise<{ type?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const [s, categories, faqs] = await Promise.all([getSettings(), getCategories(), getFaqs()]);
  const details: [string, string, string?][] = [
    ["Telephone", s.phone, `tel:${s.phone.replace(/[^\d+]/g, "")}`],
    ["WhatsApp", "Message us", `https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}`],
    ["Email", s.email, `mailto:${s.email}`],
    ["Studio", s.address],
    ["Hours", s.hours],
    ["Payment", s.paymentMethods.join(", ")],
  ];
  return (
    <>
      <section className="pt-[78px]">
        <div className="wrap grid gap-16 pb-24 pt-16 md:pb-32 md:pt-24 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label text-ink-mute">Enquiries</p>
            <h1 className="display mt-8 text-6xl md:text-[5.5rem]">Let's create something <em className="serif-i text-rani">unforgettable.</em></h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-mute">{s.expertise}</p>
            <dl className="mt-14 border-t border-ink/15">
              {details.map(([k, v, href]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-ink/15 py-4">
                  <dt className="label pt-1 text-[10px] text-ink-mute">{k}</dt>
                  <dd className="font-display text-lg">
                    {href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="hover:text-rani">{v}</a> : v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="label mt-8 text-[10px] text-rani">Est. {s.since} · Licensed · Bonded · Insured</p>
          </div>
          <Reveal className="lg:col-span-6 lg:col-start-7">
            <div className="border border-ink/15 bg-white/50 p-7 md:p-12">
              <h2 className="display text-3xl md:text-4xl">Tell us about your event</h2>
              <p className="mb-10 mt-3 text-ink-mute">A senior planner replies within 24 hours with ideas and a tailored proposal.</p>
              <EnquiryForm eventTypes={categories.map((c) => c.name)} source="contact" defaultType={type} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-ink/15 bg-paper-2 py-24 md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-ink-mute">Questions</p>
            <h2 className="display mt-6 text-5xl md:text-6xl">Good to <em className="serif-i text-rani">know.</em></h2>
          </div>
          <div className="lg:col-span-8"><Faqs items={faqs} /></div>
        </div>
      </section>
    </>
  );
}
