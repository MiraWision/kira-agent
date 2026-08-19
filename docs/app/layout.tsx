import type { Metadata } from "next";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import {
  asset,
  REPO,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_ORIGIN,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  robots: { index: true, follow: true, "max-image-preview": "large" },
  icons: { icon: [{ url: asset("/icon.svg"), type: "image/svg+xml" }] },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-canvas text-[17px] leading-[1.65]">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#org`,
                name: "MiraWision",
                url: "https://github.com/MiraWision",
              },
              {
                "@type": "SoftwareApplication",
                "@id": `${SITE_URL}/#software`,
                name: SITE_NAME,
                description: SITE_DESCRIPTION,
                applicationCategory: "DeveloperApplication",
                operatingSystem: "Node.js 20+",
                url: SITE_URL,
                codeRepository: REPO,
                license: "https://opensource.org/licenses/MIT",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              },
            ],
          }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
