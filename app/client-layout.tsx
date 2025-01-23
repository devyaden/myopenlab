"use client";

import { UserProvider } from "@/lib/contexts/userContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";

const plexSansArabic = localFont({
  src: "../fonts/IBM_Plex_Sans_Arabic/IBMPlexSansArabic-Regular.ttf",
  weight: "400",
  style: "normal",
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={plexSansArabic.className}
      suppressHydrationWarning
      // dir="rtl"
    >
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          forcedTheme="light"
          disableTransitionOnChange
        >
          <UserProvider>
            <main className="min-h-screen min-w-screen">{children}</main>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
