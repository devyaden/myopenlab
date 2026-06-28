import ClientLayout from "./client-layout";
import "./globals.css";
import { PostHogProvider } from "../components/PostHogProvider";
import {
  Schibsted_Grotesk,
  Hanken_Grotesk,
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, dirFor, normalizeLocale } from "@/lib/i18n/config";

// Atlas typefaces. Display = signage/wayfinding character; Body = humanist sans;
// Mono = code "coordinates"; Arabic = full RTL face.
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OLAB",
  description: "Transform Your Ideas Into Visual Clarity",
  openGraph: {
    title: "OLAB",
    description: "Transform Your Ideas Into Visual Clarity",
    images: [
      {
        url: "/assets/global/app-logo.png",
        width: 1200,
        height: 630,
        alt: "OLAB Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OLAB",
    description: "Transform Your Ideas Into Visual Clarity",
    images: ["/assets/global/app-logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the persisted locale server-side so <html lang/dir> is correct on first
  // paint (no flash). Defaults to English/LTR.
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${mono.variable} ${arabic.variable}`}
      suppressHydrationWarning
      dir={dirFor(locale)}
    >
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ClientLayout locale={locale}>{children}</ClientLayout>
      </body>
    </html>
  );
}
