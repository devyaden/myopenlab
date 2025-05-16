"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import AnimateOnScroll from "@/components/landing/animate-on-scroll";
import { Calendar, Check, Clock } from "lucide-react";

export default function Roadmap() {
  // Animation for page load
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Progress indicator
  const [progress, setProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const timelineTop = timelineRef.current.getBoundingClientRect().top;
        const timelineHeight = timelineRef.current.offsetHeight;
        const windowHeight = window.innerHeight;

        // Calculate how much of the timeline is visible
        if (timelineTop > windowHeight) {
          // Timeline not yet visible
          setProgress(0);
        } else if (timelineTop + timelineHeight < 0) {
          // Timeline passed
          setProgress(100);
        } else {
          // Timeline partially visible
          const visiblePart = windowHeight - timelineTop;
          const maxVisiblePart = Math.min(timelineHeight, windowHeight);
          const progressPercentage = Math.min(
            100,
            Math.max(0, (visiblePart / maxVisiblePart) * 100)
          );
          setProgress(progressPercentage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Initial calculation
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Our <span className="gradient-text">Roadmap</span>
              </h1>
              <p className="text-xl md:text-2xl text-yadn-foreground/80 mb-8 max-w-2xl mx-auto">
                Discover what we're building next and how we're evolving Olab to
                meet your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Timeline Section */}
      <section className="py-20 md:py-32 bg-yadn-background/80">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Development Timeline
              </h2>
              <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto">
                Our journey of continuous improvement and innovation.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="max-w-3xl mx-auto relative" ref={timelineRef}>
            {/* Progress indicator */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-yadn-foreground/10">
              <div
                className="absolute top-0 left-0 right-0 bg-yadn-accent-green transition-all duration-300 ease-out"
                style={{ height: `${progress}%` }}
              ></div>
            </div>

            {/* Timeline items */}
            <div className="relative z-10 space-y-24">
              {/* Current Quarter */}
              <div className="relative">
                {/* Date marker */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-yadn-accent-green border-4 border-yadn-background"></div>

                {/* Date */}
                <div className="w-[calc(50%-2rem)] pr-8 text-right">
                  <div className="inline-flex items-center bg-yadn-background/50 border border-yadn-accent-green/20 rounded-lg px-4 py-2">
                    <Calendar
                      size={16}
                      className="text-yadn-accent-green mr-2"
                    />
                    <h3 className="text-lg font-bold">Q2 2025</h3>
                  </div>
                  <div className="mt-2 text-yadn-foreground/70 text-sm">
                    Current Quarter
                  </div>
                </div>

                {/* Content */}
                <div className="ml-[calc(50%+2rem)] mt-[-4rem]">
                  <div className="bg-yadn-background/50 border border-yadn-accent-green/20 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-accent-green/20 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Check size={16} className="text-yadn-accent-green" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Enhanced Collaboration Features
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          We're introducing real-time collaboration with cursor
                          presence, comments, and live editing notifications.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-accent-green rounded-full mr-2"></span>
                          In Progress
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Advanced Shape Library
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Expanding our shape library with industry-specific
                          templates and custom shape creation tools.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Planned
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Mobile App Beta
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Launching our mobile app beta for iOS and Android to
                          view and make simple edits on the go.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Planned
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Quarter */}
              <div className="relative">
                {/* Date marker */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-yadn-foreground/30 border-4 border-yadn-background"></div>

                {/* Date */}
                <div className="w-[calc(50%-2rem)] pr-8 text-right">
                  <div className="inline-flex items-center bg-yadn-background/50 border border-yadn-foreground/20 rounded-lg px-4 py-2">
                    <Calendar
                      size={16}
                      className="text-yadn-foreground/70 mr-2"
                    />
                    <h3 className="text-lg font-bold">Q3 2025</h3>
                  </div>
                  <div className="mt-2 text-yadn-foreground/70 text-sm">
                    Next Quarter
                  </div>
                </div>

                {/* Content */}
                <div className="ml-[calc(50%+2rem)] mt-[-4rem]">
                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          AI-Powered Diagram Suggestions
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Implementing AI to suggest diagram improvements,
                          auto-layout options, and content recommendations.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Planned
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Advanced Data Connectors
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Connect your diagrams to live data sources like
                          databases, APIs, and spreadsheets for dynamic
                          visualizations.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Planned
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Presentation Mode
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Turn your diagrams into interactive presentations with
                          slide transitions and focus areas.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Planned
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future */}
              <div className="relative">
                {/* Date marker */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-yadn-foreground/30 border-4 border-yadn-background"></div>

                {/* Date */}
                <div className="w-[calc(50%-2rem)] pr-8 text-right">
                  <div className="inline-flex items-center bg-yadn-background/50 border border-yadn-foreground/20 rounded-lg px-4 py-2">
                    <Calendar
                      size={16}
                      className="text-yadn-foreground/70 mr-2"
                    />
                    <h3 className="text-lg font-bold">Q4 2025 & Beyond</h3>
                  </div>
                  <div className="mt-2 text-yadn-foreground/70 text-sm">
                    Future
                  </div>
                </div>

                {/* Content */}
                <div className="ml-[calc(50%+2rem)] mt-[-4rem]">
                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          3D Diagram Support
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Create and visualize 3D diagrams for complex systems,
                          architecture, and spatial planning.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Exploring
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          Enterprise Integration Suite
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Comprehensive integrations with enterprise tools like
                          Jira, Salesforce, and Microsoft Teams.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Exploring
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yadn-background/50 border border-yadn-foreground/10 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yadn-foreground/10 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Clock size={16} className="text-yadn-foreground/70" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">
                          VR/AR Visualization
                        </h4>
                        <p className="text-yadn-foreground/70 mb-4">
                          Experience your diagrams in virtual and augmented
                          reality for immersive collaboration.
                        </p>
                        <div className="flex items-center text-sm text-yadn-foreground/60">
                          <span className="inline-block w-2 h-2 bg-yadn-foreground/40 rounded-full mr-2"></span>
                          Exploring
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Request Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <AnimateOnScroll>
            <div className="max-w-4xl mx-auto bg-yadn-accent-green/5 border border-yadn-accent-green/20 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Have a Feature Request?
              </h2>
              <p className="text-lg text-yadn-foreground/70 max-w-2xl mx-auto mb-8">
                We're always looking to improve Olab based on your feedback. Let
                us know what features you'd like to see next!
              </p>
              <a
                href="/contact"
                className="inline-flex px-8 py-3 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors font-medium items-center justify-center"
              >
                Submit Feature Request
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </main>
  );
}
