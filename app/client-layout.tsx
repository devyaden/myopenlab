"use client";

import { UserProvider } from "@/lib/contexts/userContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { Quicksand, Rubik } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const rubik = Rubik({
  subsets: ["arabic"],
  variable: "--font-rubik",
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${rubik.variable}`}
      suppressHydrationWarning
      dir="ltr"
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
