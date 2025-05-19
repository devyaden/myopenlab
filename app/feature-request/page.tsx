"use client";

import type React from "react";

import { useState } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

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
      setError("There was an error submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <AnimateOnScroll>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Request a <span className="gradient-text">Feature</span>
              </h1>
              <p className="text-xl md:text-2xl text-yadn-foreground/80 mb-8 max-w-2xl mx-auto">
                Help shape the future of Olab by suggesting features that would
                make your experience better.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Feature Request Form Section */}
      <section className="py-20 md:py-32 bg-yadn-background/80">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <AnimateOnScroll>
              <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 md:p-8 shadow-lg">
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle
                        size={32}
                        className="text-yadn-accent-green"
                      />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">
                      Feature Request Submitted!
                    </h2>
                    <p className="text-yadn-foreground/70 mb-8">
                      Thank you for your suggestion! We've received your feature
                      request and our team will review it soon.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-6">
                      Submit Your Feature Request
                    </h2>

                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
                        <AlertCircle size={20} className="text-red-500 mr-3" />
                        <p className="text-red-500">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium mb-1"
                          >
                            Your Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium mb-1"
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="featureTitle"
                          className="block text-sm font-medium mb-1"
                        >
                          Feature Title
                        </label>
                        <input
                          type="text"
                          id="featureTitle"
                          name="featureTitle"
                          value={formData.featureTitle}
                          onChange={handleChange}
                          placeholder="A short, descriptive title for your feature idea"
                          className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="featureDescription"
                          className="block text-sm font-medium mb-1"
                        >
                          Feature Description
                        </label>
                        <textarea
                          id="featureDescription"
                          name="featureDescription"
                          value={formData.featureDescription}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Describe your feature idea in detail. What would it do? How would it work?"
                          className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                          required
                        ></textarea>
                      </div>

                      <div>
                        <label
                          htmlFor="useCase"
                          className="block text-sm font-medium mb-1"
                        >
                          Use Case
                        </label>
                        <textarea
                          id="useCase"
                          name="useCase"
                          value={formData.useCase}
                          onChange={handleChange}
                          rows={3}
                          placeholder="How would this feature help you? What problem would it solve?"
                          className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                          required
                        ></textarea>
                      </div>

                      <div>
                        <label
                          htmlFor="priority"
                          className="block text-sm font-medium mb-1"
                        >
                          Priority Level
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                        >
                          <option value="low">
                            Low - Would be nice to have
                          </option>
                          <option value="medium">
                            Medium - Would improve my workflow
                          </option>
                          <option value="high">
                            High - Would significantly improve my experience
                          </option>
                          <option value="critical">
                            Critical - Currently blocking my work
                          </option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            Submit Feature Request{" "}
                            <Send size={16} className="ml-2" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll>
              <div className="mt-16 text-center">
                <h3 className="text-xl font-semibold mb-4">
                  How We Process Feature Requests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-yadn-accent-green text-xl font-bold">
                        1
                      </span>
                    </div>
                    <h4 className="text-lg font-medium mb-2">Review</h4>
                    <p className="text-yadn-foreground/70">
                      Our product team reviews all feature requests to
                      understand user needs.
                    </p>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-yadn-accent-green text-xl font-bold">
                        2
                      </span>
                    </div>
                    <h4 className="text-lg font-medium mb-2">Prioritize</h4>
                    <p className="text-yadn-foreground/70">
                      We prioritize features based on user impact and technical
                      feasibility.
                    </p>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-yadn-accent-green text-xl font-bold">
                        3
                      </span>
                    </div>
                    <h4 className="text-lg font-medium mb-2">Implement</h4>
                    <p className="text-yadn-foreground/70">
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
