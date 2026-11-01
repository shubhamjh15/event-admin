import { getTestimonials, pageMetadata } from "@/lib/data";
import { sized } from "@/lib/img";
import { Reveal } from "@/components/reveal";
import { Monogram, Stars } from "@/components/ui";
import { TestimonialForm } from "@/components/forms";

export const revalidate = 600;
export const generateMetadata = () => pageMetadata("testimonials", "/testimonials");

export default async function TestimonialsPage() {
  const items = await getTestimonials();
  return (
    <>
      <section className="pt-[78px]">
        <div className="wrap pb-12 pt-16 md:pb-16 md:pt-24">
          <p className="label text-ink-mute">Client stories</p>
          <h1 className="display mt-8 text-[15vw] leading-[0.88] md:text-[9.5rem]">In their <em className="serif-i text-rani">words.</em></h1>
        </div>
      </section>

      <section className="wrap grid gap-16 pb-24 md:pb-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {items.length ? (
            <ul className="border-t border-ink/15">
              {items.map((t, i) => (
                <Reveal as="li" key={t._id} className="border-b border-ink/15 py-10">
                  <Stars value={t.rating} className="h-3.5 w-3.5" />
                  <blockquote className="mt-4 font-display text-2xl leading-snug md:text-3xl">“{t.quote}”</blockquote>
                  <div className="mt-6 flex items-center gap-4">
                    {t.photo ? <img src={sized(t.photo, 200)} alt="" loading="lazy" className="h-12 w-12 object-cover" /> : <Monogram name={t.name} index={i} size="sm" className="h-12 w-12" />}
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      {t.role && <p className="text-sm text-ink-mute">{t.role}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          ) : (
            <p className="border-y border-ink/15 py-16 text-center font-display text-3xl">Be the first to share your story.</p>
          )}
        </div>
        <div id="share" className="scroll-mt-28 lg:col-span-5">
          <div className="border border-ink/15 bg-white/50 p-7 md:p-10 lg:sticky lg:top-28">
            <p className="label text-[10px] text-rani">Share your experience</p>
            <h2 className="display mt-3 text-4xl">Celebrated with us?</h2>
            <p className="mb-8 mt-3 text-ink-mute">We&apos;d love to hear about it. Your testimonial appears here once our team has reviewed it.</p>
            <TestimonialForm />
          </div>
        </div>
      </section>
    </>
  );
}
