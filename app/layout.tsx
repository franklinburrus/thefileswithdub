import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME, SOCIAL_IMAGE, safeJsonLd } from "./seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "The Files With Dub is an independent Queens, New York platform for culture, commentary, interviews, and media production.",
  alternates: { canonical: SITE_URL },
  verification: {
    google: "F_izlNhQmUjVlZ382YU1E7XF0lklWpIWeJho2OnAECo",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "Real conversations. Unfiltered perspectives. Media built differently.",
    url: SITE_URL,
    images: [{ url: SOCIAL_IMAGE, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: "Real conversations. Unfiltered perspectives.", images: [SOCIAL_IMAGE] },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/files-with-dub-globe-logo.png`,
      sameAs: ["https://www.youtube.com/@TheFilesWithDub", "https://x.com/TheFilesWithDUB", "https://www.patreon.com/cw/CANTDUBME"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />{children}</body></html>;
}
