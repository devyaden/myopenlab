"use client";

import type React from "react";

import { useState } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { Button } from "@/components/ui/button";
import { TeachingEmptyState } from "@/components/ui/teaching-empty-state";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  MailCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const inputClasses =
  "w-full rounded-md border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success
      setIsSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(
        "We couldn't send your message. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 z-0" aria-hidden>
          <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-b from-signal/5 to-transparent"></div>
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-signal/5 blur-3xl"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <AnimateOnScroll>
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
                Get in <span className="gradient-text">touch</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
                Have questions or need help? We're here to assist you on your
                journey.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="bg-muted/40 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <AnimateOnScroll>
              <div>
                <h2 className="font-display text-3xl font-bold">
                  Contact information
                </h2>

                <div className="mt-8 space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-signal-tint">
                      <Mail size={24} className="text-signal" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">Email us</h3>
                      <p className="mt-2 mb-1 text-muted-foreground">
                        General inquiries:
                      </p>
                      <a
                        href="mailto:info@Olab.com"
                        className="text-signal transition-colors hover:text-signal-bright"
                      >
                        info@Olab.com
                      </a>

                      <p className="mt-4 mb-1 text-muted-foreground">Support:</p>
                      <a
                        href="mailto:support@Olab.com"
                        className="text-signal transition-colors hover:text-signal-bright"
                      >
                        support@Olab.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-signal-tint">
                      <Phone size={24} className="text-signal" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">Call us</h3>
                      <p className="mt-2 mb-1 text-muted-foreground">
                        Main office:
                      </p>
                      <p className="text-lg">+1 (555) 123-4567</p>

                      <p className="mt-4 mb-1 text-muted-foreground">
                        Support hotline:
                      </p>
                      <p className="text-lg">+1 (555) 987-6543</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Available Monday to Friday, 9am to 5pm EST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-signal-tint">
                      <MapPin size={24} className="text-signal" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">Visit us</h3>
                      <p className="mt-2 mb-1 text-muted-foreground">
                        Headquarters:
                      </p>
                      <p className="text-lg">
                        123 Innovation Street
                        <br />
                        Tech City, TC 12345
                        <br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-signal-tint">
                      <MessageSquare
                        size={24}
                        className="text-signal"
                        aria-hidden
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">Connect with us</h3>
                      <div className="mt-2 flex gap-4">
                        <a
                          href="#"
                          className="text-muted-foreground transition-colors hover:text-signal"
                        >
                          Twitter
                        </a>
                        <a
                          href="#"
                          className="text-muted-foreground transition-colors hover:text-signal"
                        >
                          LinkedIn
                        </a>
                        <a
                          href="#"
                          className="text-muted-foreground transition-colors hover:text-signal"
                        >
                          Facebook
                        </a>
                        <a
                          href="#"
                          className="text-muted-foreground transition-colors hover:text-signal"
                        >
                          Instagram
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-medium">
                    Looking to request a feature?
                  </h3>
                  <p className="mt-4 mb-4 text-muted-foreground">
                    Have an idea for a new feature or improvement? We'd love to
                    hear it.
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/feature-request">Submit a feature request</Link>
                  </Button>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="rounded-xl border border-border bg-card p-6 shadow-atlas-md md:p-8">
                {isSubmitted ? (
                  <TeachingEmptyState
                    icon={<MailCheck className="size-6" />}
                    title="Thanks — we got your message"
                    description="Our team will get back to you by email as soon as we can, usually within one business day."
                    action={{
                      label: "Send another message",
                      onClick: () => setIsSubmitted(false),
                    }}
                  />
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-bold">
                      Send us a message
                    </h2>

                    {error && (
                      <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                        <AlertCircle
                          size={20}
                          className="mt-0.5 flex-shrink-0 text-destructive"
                          aria-hidden
                        />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-1 block text-sm font-medium"
                        >
                          Your name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={inputClasses}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-1 block text-sm font-medium"
                        >
                          Email address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClasses}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="mb-1 block text-sm font-medium"
                        >
                          Subject
                        </label>
                        <input
                          type="text"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className={inputClasses}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="mb-1 block text-sm font-medium"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          className={inputClasses}
                          required
                        ></textarea>
                      </div>

                      <Button
                        type="submit"
                        variant="signal"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          "Sending…"
                        ) : (
                          <>
                            Send message <Send size={16} />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="mb-16 text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Find quick answers to common questions about Olab.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">
                    How do I get started with Olab?
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Getting started is easy. Simply sign up for an account, and
                    you'll be guided through a quick onboarding process. You can
                    create your first diagram in minutes.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">
                    Is there a free trial available?
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Yes, we offer a 14-day free trial with full access to all
                    features. No credit card required to get started.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">
                    How does the collaboration feature work?
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    You can invite team members to collaborate on your diagrams
                    in real time. Everyone can see changes as they happen, and
                    you can control access permissions for each collaborator.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">
                    Can I export my diagrams?
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    You can export your diagrams in multiple formats including
                    PDF, PNG, SVG, and JSON. Table views can be exported as CSV
                    or XLSX files.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-xl font-semibold">Is my data secure?</h3>
                  <p className="mt-2 text-muted-foreground">
                    We take security seriously. All your data is encrypted both
                    in transit and at rest. We use industry-standard security
                    practices and regular audits to ensure your information
                    stays protected.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="mt-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  Still have questions? Our support team is ready to help.
                </p>
                <Button asChild variant="signal">
                  <a href="mailto:support@Olab.com">Contact support</a>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
