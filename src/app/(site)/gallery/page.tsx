import { getGallery, getSettings } from "@/lib/data";
import { GalleryGrid } from "@/components/interactive";
import { CtaBlock } from "@/components/ui";

export const metadata = { title: "Gallery", description: "Weddings, concerts, corporate events and celebrations by Lit Concierge." };

export default async function GalleryPage() {
  const [s, items] = await Promise.all([getSettings(), getGallery()]);
  return (
    <>
      <section className="pt-[78px]">
        <div className="wrap pb-12 pt-16 md:pt-24">
          <div className="flex items-center justify-between text-ink-mute">
            <span className="label">Gallery</span>
            <span className="font-display text-sm italic">{items.length} moments · {s.since} – today</span>
          </div>
          <h1 className="display mt-8 text-[15vw] leading-[0.88] md:text-[9.5rem]">
            Moments we've <em className="serif-i text-rani">lit up.</em>
          </h1>
        </div>
      </section>
      <section className="wrap pb-24 md:pb-32">
        <GalleryGrid items={items} />
      </section>
      <CtaBlock tone="peacock" label="Your moment next" title="Let's create" italic="your story." />
    </>
  );
}
