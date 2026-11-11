import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories, getSettings } from "@/lib/data";
import { settings as defaultSettings } from "@/lib/seed-data";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, categories] = await Promise.all([
    getSettings().catch(() => defaultSettings),
    getCategories().catch(() => [] as any[]),
  ]);
  return (
    <>
      <Header phone={s.phone} since={s.since} />
      <main>{children}</main>
      <Footer s={s} categories={categories} />
      {s.whatsapp && (
        <aside aria-label="Quick contact">
        <a
          href={`https://wa.me/${s.whatsapp.replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#1FAF54] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,.4)] transition-transform hover:scale-105"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
        </aside>
      )}
    </>
  );
}
