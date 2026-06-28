"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, MapPinOff } from "lucide-react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [path, setPath] = useState<string>("");

  // Get the current path for display
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPath(window.location.pathname);
    }
  }, []);

  // Animation for page load
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 z-0" aria-hidden>
          <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-b from-signal/5 to-transparent"></div>
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-signal/5 blur-3xl"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className={`transition-all duration-1000 ease-out ${
                isVisible
                  ? "translate-y-0 transform opacity-100"
                  : "translate-y-10 transform opacity-0"
              }`}
            >
              <div className="mb-8 flex justify-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-signal-tint">
                  <MapPinOff size={40} className="text-signal" aria-hidden />
                </div>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                We couldn't find that page
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                The link may be broken, or the page may have moved. Let's get
                you back on track.
              </p>

              {path && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>You tried to reach</span>
                  <code className="rounded-sm bg-code-bg px-1.5 py-0.5 font-mono text-xs text-code-text">
                    {path}
                  </code>
                </div>
              )}

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild variant="signal">
                  <Link href="/">
                    <ArrowLeft className="size-4" />
                    Back to home
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex flex-col items-center gap-2 text-center">
                <Compass className="size-6 text-signal" aria-hidden />
                <h2 className="font-display text-2xl font-bold md:text-3xl">
                  Try one of these instead
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    href: "/",
                    title: "Home",
                    description: "Return to our main landing page.",
                  },
                  {
                    href: "/roadmap",
                    title: "Roadmap",
                    description: "See what features we're working on next.",
                  },
                  {
                    href: "/feature-request",
                    title: "Feature request",
                    description: "Suggest new features for the platform.",
                  },
                  {
                    href: "/contact",
                    title: "Contact",
                    description: "Get in touch with our team.",
                  },
                  {
                    href: "/terms",
                    title: "Terms of Service",
                    description: "Read our terms and conditions.",
                  },
                  {
                    href: "/privacy-policy",
                    title: "Privacy Policy",
                    description: "Learn about our privacy practices.",
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-signal/40 hover:bg-accent"
                  >
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
