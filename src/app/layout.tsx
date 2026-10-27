import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500"], variable: "--font-display", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Lit Concierge — Luxury Events Since 1989", template: "%s | Lit Concierge" },
  description: "Licensed, bonded & insured luxury event concierge since 1989.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#FAF6EF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="IMG"&&!t.dataset.fb){t.dataset.fb="1";t.removeAttribute("srcset");t.src="/fallback.svg"}},true);`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
