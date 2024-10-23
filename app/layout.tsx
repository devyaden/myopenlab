import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";

import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "YADN Diagrams",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const plexSansArabic = localFont({
  src: "../fonts/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Regular.ttf",
  weight: "400",
  style: "normal",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={plexSansArabic.className}
      suppressHydrationWarning
      dir="rtl"
    >
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          forcedTheme="light"
          disableTransitionOnChange
        >
          <main className="min-h-screen min-w-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
