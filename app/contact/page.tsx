"use client";

import type React from "react";

import { useState } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import {
  Send,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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
      setError("There was an error sending your message. Please try again.");
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
                Get in <span className="gradient-text">Touch</span>
              </h1>
              <p className="text-xl md:text-2xl text-yadn-foreground/80 mb-8 max-w-2xl mx-auto">
                Have questions or need help? We're here to assist you on your
                journey.
              </p>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 md:py-32 bg-yadn-background/80">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <AnimateOnScroll>
              <div>
                <h2 className="text-3xl font-bold mb-8">Contact Information</h2>

                <div className="space-y-8">
                  <div className="flex items-start space-x-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail size={24} className="text-yadn-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Email Us</h3>
                      <p className="text-yadn-foreground/70 mb-1">
                        General Inquiries:
                      </p>
                      <a
                        href="mailto:info@Olab.com"
                        className="text-yadn-accent-green hover:text-yadn-accent-green/80 transition-colors"
                      >
                        info@Olab.com
                      </a>

                      <p className="text-yadn-foreground/70 mt-4 mb-1">
                        Support:
                      </p>
                      <a
                        href="mailto:support@Olab.com"
                        className="text-yadn-accent-green hover:text-yadn-accent-green/80 transition-colors"
                      >
                        support@Olab.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone size={24} className="text-yadn-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Call Us</h3>
                      <p className="text-yadn-foreground/70 mb-1">
                        Main Office:
                      </p>
                      <p className="text-lg">+1 (555) 123-4567</p>

                      <p className="text-yadn-foreground/70 mt-4 mb-1">
                        Support Hotline:
                      </p>
                      <p className="text-lg">+1 (555) 987-6543</p>
                      <p className="text-sm text-yadn-foreground/60 mt-1">
                        Available Monday-Friday, 9am-5pm EST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-yadn-accent-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">Visit Us</h3>
                      <p className="text-yadn-foreground/70 mb-1">
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

                  <div className="flex items-start space-x-6">
                    <div className="w-12 h-12 bg-yadn-accent-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare
                        size={24}
                        className="text-yadn-accent-green"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-2">
                        Connect With Us
                      </h3>
                      <div className="flex space-x-4 mt-2">
                        <a
                          href="#"
                          className="text-yadn-foreground/70 hover:text-yadn-accent-green transition-colors"
                        >
                          Twitter
                        </a>
                        <a
                          href="#"
                          className="text-yadn-foreground/70 hover:text-yadn-accent-green transition-colors"
                        >
                          LinkedIn
                        </a>
                        <a
                          href="#"
                          className="text-yadn-foreground/70 hover:text-yadn-accent-green transition-colors"
                        >
                          Facebook
                        </a>
                        <a
                          href="#"
                          className="text-yadn-foreground/70 hover:text-yadn-accent-green transition-colors"
                        >
                          Instagram
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <h3 className="text-xl font-medium mb-4">
                    Looking to Request a Feature?
                  </h3>
                  <p className="text-yadn-foreground/70 mb-4">
                    Have an idea for a new feature or improvement? We'd love to
                    hear it!
                  </p>
                  <Link
                    href="/feature-request"
                    className="inline-flex px-6 py-2 bg-yadn-foreground/10 text-yadn-foreground rounded-md hover:bg-yadn-foreground/20 transition-colors"
                  >
                    Submit a Feature Request
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>

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
                    <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                    <p className="text-yadn-foreground/70 mb-8">
                      Thank you for reaching out! We've received your message
                      and will get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-6">
                      Send Us a Message
                    </h2>

                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center">
                        <AlertCircle size={20} className="text-red-500 mr-3" />
                        <p className="text-red-500">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
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
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={6}
                          className="w-full px-4 py-2 bg-yadn-background/50 border border-yadn-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-yadn-accent-green/50"
                          required
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium flex items-center justify-center disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message <Send size={16} className="ml-2" />
                          </>
                        )}
                      </button>
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
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto">
                Find quick answers to common questions about Olab.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto">
            <AnimateOnScroll>
              <div className="space-y-6">
                <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    How do I get started with Olab?
                  </h3>
                  <p className="text-yadn-foreground/70">
                    Getting started is easy! Simply sign up for an account, and
                    you'll be guided through a quick onboarding process. You can
                    create your first diagram in minutes.
                  </p>
                </div>

                <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Is there a free trial available?
                  </h3>
                  <p className="text-yadn-foreground/70">
                    Yes, we offer a 14-day free trial with full access to all
                    features. No credit card required to get started.
                  </p>
                </div>

                <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    How does the collaboration feature work?
                  </h3>
                  <p className="text-yadn-foreground/70">
                    You can invite team members to collaborate on your diagrams
                    in real-time. Everyone can see changes as they happen, and
                    you can control access permissions for each collaborator.
                  </p>
                </div>

                <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Can I export my diagrams?
                  </h3>
                  <p className="text-yadn-foreground/70">
                    You can export your diagrams in multiple formats including
                    PDF, PNG, SVG, and JSON. Table views can be exported as CSV
                    or XLSX files.
                  </p>
                </div>

                <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Is my data secure?
                  </h3>
                  <p className="text-yadn-foreground/70">
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
                <p className="text-yadn-foreground/70 mb-4">
                  Still have questions? Our support team is ready to help.
                </p>
                <a
                  href="mailto:support@Olab.com"
                  className="inline-flex px-6 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
