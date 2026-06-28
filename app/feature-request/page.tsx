"use client";

import type React from "react";

import { useState } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { Button } from "@/components/ui/button";
import { TeachingEmptyState } from "@/components/ui/teaching-empty-state";
import { Send, Lightbulb, AlertCircle } from "lucide-react";

const inputClasses =
  "w-full rounded-md border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function FeatureRequest() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    featureTitle: "",
    featureDescription: "",
    useCase: "",
    priority: "medium",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
        featureTitle: "",
        featureDescription: "",
        useCase: "",
        priority: "medium",
      });
    } catch (err) {
      setError(
        "We couldn't submit your request. Please check your connection and try again."
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
                Request a <span className="gradient-text">feature</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
                Help shape the future of Olab by suggesting features that would
                make your experience better.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Feature Request Form Section */}
      <section className="bg-muted/40 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <div className="rounded-xl border border-border bg-card p-6 shadow-atlas-md md:p-8">
                {isSubmitted ? (
                  <TeachingEmptyState
                    icon={<Lightbulb className="size-6" />}
                    title="Thanks — we got your request"
                    description="Our product team reviews every suggestion. We'll be in touch by email if we need more detail."
                    action={{
                      label: "Submit another request",
                      onClick: () => setIsSubmitted(false),
                    }}
                  />
                ) : (
                  <>
                    <h2 className="font-display text-2xl font-bold">
                      Submit your feature request
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
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      </div>

                      <div>
                        <label
                          htmlFor="featureTitle"
                          className="mb-1 block text-sm font-medium"
                        >
                          Feature title
                        </label>
                        <input
                          type="text"
                          id="featureTitle"
                          name="featureTitle"
                          value={formData.featureTitle}
                          onChange={handleChange}
                          placeholder="A short, descriptive title for your feature idea"
                          className={inputClasses}
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="featureDescription"
                          className="mb-1 block text-sm font-medium"
                        >
                          Feature description
                        </label>
                        <textarea
                          id="featureDescription"
                          name="featureDescription"
                          value={formData.featureDescription}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Describe your idea in detail. What would it do? How would it work?"
                          className={inputClasses}
                          required
                        ></textarea>
                      </div>

                      <div>
                        <label
                          htmlFor="useCase"
                          className="mb-1 block text-sm font-medium"
                        >
                          Use case
                        </label>
                        <textarea
                          id="useCase"
                          name="useCase"
                          value={formData.useCase}
                          onChange={handleChange}
                          rows={3}
                          placeholder="How would this feature help you? What problem would it solve?"
                          className={inputClasses}
                          required
                        ></textarea>
                      </div>

                      <div>
                        <label
                          htmlFor="priority"
                          className="mb-1 block text-sm font-medium"
                        >
                          Priority level
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className={inputClasses}
                        >
                          <option value="low">
                            Low — would be nice to have
                          </option>
                          <option value="medium">
                            Medium — would improve my workflow
                          </option>
                          <option value="high">
                            High — would significantly improve my experience
                          </option>
                          <option value="critical">
                            Critical — currently blocking my work
                          </option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        variant="signal"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          "Submitting…"
                        ) : (
                          <>
                            Submit feature request <Send size={16} />
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="mt-16 text-center">
                <h3 className="font-display text-xl font-semibold">
                  How we process feature requests
                </h3>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-signal-tint">
                      <span className="text-xl font-bold text-signal">1</span>
                    </div>
                    <h4 className="text-lg font-medium">Review</h4>
                    <p className="mt-2 text-muted-foreground">
                      Our product team reviews all feature requests to
                      understand user needs.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-signal-tint">
                      <span className="text-xl font-bold text-signal">2</span>
                    </div>
                    <h4 className="text-lg font-medium">Prioritize</h4>
                    <p className="mt-2 text-muted-foreground">
                      We prioritize features based on user impact and technical
                      feasibility.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-signal-tint">
                      <span className="text-xl font-bold text-signal">3</span>
                    </div>
                    <h4 className="text-lg font-medium">Implement</h4>
                    <p className="mt-2 text-muted-foreground">
                      Selected features are added to our roadmap and developed
                      in upcoming releases.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
