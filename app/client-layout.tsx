"use client";

import { UserProvider } from "@/lib/contexts/userContext";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
