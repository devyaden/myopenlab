"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { ArrowRight, ChevronRight, Send } from "lucide-react";
import FeaturesGrid from "@/components/landing/features-grid";
import DottedBackground from "@/components/landing/dotted-background";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail("");
    setMessage("");
  };

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="min-h-screen text-yadn-foreground bg-yadn-background">
      <Navbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yadn-accent-green/5 blur-3xl"></div>
          <DottedBackground />
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Transform Your Ideas Into{" "}
                <span className="gradient-text">Visual Clarity</span>
              </h1>
              <p className="text-xl md:text-2xl text-yadn-foreground/80 mb-8 max-w-2xl mx-auto">
                Create, connect, and collaborate with our powerful diagramming
                tool that brings your thoughts to life.
              </p>
            </div>

            <div
              className={`flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-300 ease-out ${
                isVisible
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-10"
              }`}
            >
              <Link
                href="/signup"
                className="px-8 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center"
              >
                Get Started <ArrowRight size={18} className="ml-2" />
              </Link>
              <Link
                href="/features"
                className="px-8 py-3 bg-foreground/10 text-yadn-foreground rounded-md hover:bg-foreground/20 transition-colors font-medium flex items-center justify-center"
              >
                Explore Features
              </Link>
            </div>
          </div>

          <div
            className={`mt-16 md:mt-24 max-w-4xl mx-auto relative transition-all duration-1000 delay-500 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="relative w-full h-[300px] md:h-[400px] bg-gradient-to-br from-yadn-background/80 to-yadnbackground/40 rounded-xl border border-yadn-foreground/10 backdrop-blur-sm shadow-xl float-animation">
              <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-br from-yadn-background/80 to-yadnbackground/40 rounded-xl border border-yadn-foreground/10 backdrop-blur-sm shadow-xl float-animation">
                {/* Window controls at the top */}
                <div className="absolute top-4 left-4 right-4 h-8 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
                    <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
                    <div className="w-3 h-3 rounded-full bg-foreground/20"></div>
                  </div>
                </div>

                {/* Image container with matching border radius */}
                <div className="absolute top-14 left-4 right-4 bottom-4 flex items-center justify-center overflow-hidden rounded-lg">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/landing/landing-bg.png"
                      alt="Company Hierarchy Diagram"
                      fill
                      style={{
                        objectFit: "contain",
                        borderRadius: "0.7rem", // 8px to match rounded-lg
                        filter: "brightness(0.85) contrast(0.9) invert(0.1)",
                      }}
                      className="rounded-lg" // Using both className and style for better browser compatibility
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-yadn-background/80">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Powerful Features for Complex Ideas
              </h2>
              <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto">
                Everything you need to visualize, organize, and connect your
                thoughts in one seamless experience.
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <FeaturesGrid />
          </AnimateOnScroll>

          <AnimateOnScroll className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center text-yadn-accent-green hover:text-yadn-accent-green/80 transition-colors font-medium"
            >
              Explore all features <ChevronRight size={16} className="ml-1" />
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How Olab Works
              </h2>
              <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto">
                A seamless experience from idea to visualization in just a few
                steps.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yadn-accent-green text-xl font-bold">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Create Your Canvas
                </h3>
                <p className="text-yadn-foreground/70">
                  Start with a blank canvas and add shapes, connections, and
                  nested elements to visualize your ideas.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yadn-accent-green text-xl font-bold">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Switch Views</h3>
                <p className="text-yadn-foreground/70">
                  Toggle between canvas, table, and document views to see your
                  data from different perspectives.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="text-center">
                <div className="w-16 h-16 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-yadn-accent-green text-xl font-bold">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Share & Collaborate
                </h3>
                <p className="text-yadn-foreground/70">
                  Generate share links to collaborate with team members or
                  export your work in various formats.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-yadn-background to-yadn-background/80">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="max-w-4xl mx-auto bg-yadn-accent-green/5 border border-yadn-accent-green/20 rounded-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Transform Your Ideas?
                </h2>
                <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto">
                  Join thousands of users who are already visualizing their
                  thoughts with Olab.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3 bg-foreground/10 text-yadn-foreground rounded-md hover:bg-foreground/20 transition-colors font-medium flex items-center justify-center"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Get in Touch
                </h2>
                <p className="text-lg text-yadn-foreground/70 mb-6">
                  Have questions or need help? We're here to assist you on your
                  journey.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                          stroke="#09BC8A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Email Us</h3>
                      <p className="text-yadn-foreground/70">
                        support@Olab.com
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z"
                          stroke="#09BC8A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Call Us</h3>
                      <p className="text-yadn-foreground/70">
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.6569 16.6569C16.7202 17.5935 14.7616 19.5521 13.4138 20.8999C12.6327 21.681 11.3677 21.6814 10.5866 20.9003C9.26234 19.576 7.34159 17.6553 6.34315 16.6569C3.21895 13.5327 3.21895 8.46734 6.34315 5.34315C9.46734 2.21895 14.5327 2.21895 17.6569 5.34315C20.781 8.46734 20.781 13.5327 17.6569 16.6569Z"
                          stroke="#09BC8A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z"
                          stroke="#09BC8A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Visit Us</h3>
                      <p className="text-yadn-foreground/70">
                        123 Innovation Street, Tech City, TC 12345
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <form
                onSubmit={handleSubmit}
                className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 md:p-8"
              >
                <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium mb-1"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message <Send size={16} className="ml-2" />
                      </>
                    )}
                  </button>
                  {isSubmitted && (
                    <div className="mt-4 p-3 bg-yadn-accent-green/10 border border-yadn-accent-green/20 rounded-md text-center">
                      Thank you for your message! We'll get back to you soon.
                    </div>
                  )}
                </div>
              </form>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
