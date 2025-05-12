"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";

export default function UnderDevelopment() {
  const router = useRouter();
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
    <main className="min-h-screen text-yadn-foreground bg-yadn-background">
      <Navbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yadn-accent-green/5 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yadn-accent-green/5 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`transition-all duration-1000 ease-out ${
                isVisible
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-10"
              }`}
            >
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-yadn-accent-green/10 rounded-full flex items-center justify-center">
                  <Construction size={48} className="text-yadn-accent-green" />
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Page <span className="gradient-text">Under Development</span>
              </h1>

              <p className="text-xl md:text-2xl text-yadn-foreground/80 mb-4 max-w-2xl mx-auto">
                We're working hard to build this page.
              </p>

              {path && (
                <p className="text-lg text-yadn-foreground/60 mb-8 max-w-2xl mx-auto">
                  The page{" "}
                  <code className="bg-yadn-foreground/10 px-2 py-1 rounded">
                    {path}
                  </code>{" "}
                  is coming soon.
                </p>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link
                  href="/"
                  className="px-8 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center"
                >
                  <ArrowLeft size={18} className="mr-2" /> Back to Home
                </Link>

                <Link
                  href="/contact"
                  className="px-8 py-3 bg-yadn-foreground/10 text-yadn-foreground rounded-md hover:bg-yadn-foreground/20 transition-colors font-medium flex items-center justify-center"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Explore Available Pages
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">Home</h3>
                  <p className="text-yadn-foreground/70">
                    Return to our main landing page.
                  </p>
                </Link>

                <Link
                  href="/roadmap"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">Roadmap</h3>
                  <p className="text-yadn-foreground/70">
                    See what features we're working on next.
                  </p>
                </Link>

                <Link
                  href="/feature-request"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    Feature Request
                  </h3>
                  <p className="text-yadn-foreground/70">
                    Suggest new features for our platform.
                  </p>
                </Link>

                <Link
                  href="/contact"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">Contact</h3>
                  <p className="text-yadn-foreground/70">
                    Get in touch with our team.
                  </p>
                </Link>

                <Link
                  href="/terms"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    Terms of Service
                  </h3>
                  <p className="text-yadn-foreground/70">
                    Read our terms and conditions.
                  </p>
                </Link>

                <Link
                  href="/privacy"
                  className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 hover:border-yadn-accent-green/30 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-yadn-foreground/70">
                    Learn about our privacy practices.
                  </p>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
