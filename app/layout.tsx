import ClientLayout from "./client-layout";
import "./globals.css";
import { PostHogProvider } from "../components/PostHogProvider";
import { Quicksand, Rubik } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const rubik = Rubik({
  subsets: ["arabic"],
  variable: "--font-rubik",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OLAB",
  description: "Transform Your Ideas Into Visual Clarity",
};

export default function RootLayout({
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
        <PostHogProvider>
          <ClientLayout>{children}</ClientLayout>
        </PostHogProvider>
      </body>
    </html>
  );
}
