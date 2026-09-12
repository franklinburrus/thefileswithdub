import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Files With Dub — Culture, commentary, and media production",
  description: "The Files With Dub: independent culture, commentary, interviews, studio sessions, and media consulting.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "The Files With Dub",
    description: "Real conversations. Unfiltered perspectives. Media built differently.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: "The Files With Dub", description: "Real conversations. Unfiltered perspectives." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
