"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function EngagementSection() {
  const features = [
    {
      title: "Version Control & History",
      description:
        "Track changes, revert to previous versions, and ensure a smooth workflow with automatic save and version history.",
      image: "/images/version.png",
    },
    {
      title: "Custom Styling & Themes",
      description:
        "ersonalize diagrams with colors, fonts, and shapes to match your brand or project needs.",
      image: "/images/custom.png",
    },
    {
      title: "AI-Powered Suggestions",
      description:
        "Get smart recommendations for optimizing flowcharts, improving layouts, and maintaining logical consistency.",
      image: "/images/ai.png",
    },
    {
      title: "Multi-Device Access",
      description:
        "Access and edit your diagrams from desktop, tablet, or mobile for on-the-go productivity.",
      image: "/images/multi-device.png",
    },
    {
      title: "Role-Based Permissions",
      description:
        "Control access levels for team members, ensuring secure collaboration with view-only, edit, or admin roles.",
      image: "/images/roles.png",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollLocked = useRef(false);

  // Handle scroll within the section
  const handleWheel = (e: WheelEvent) => {
    console.log("🚀 ~ handleWheel ~ e:", e)
    e.preventDefault();

    // Lock scrolling temporarily to prevent rapid scrolling
    scrollLocked.current = true;

    if (e.deltaY > 0) {
      // Scroll down - next feature
      setActiveIndex((prev) => (prev < features.length - 1 ? prev + 1 : prev));

      if (activeIndex === features.length - 1) {
        if (sectionRef.current) {
          sectionRef.current.removeEventListener("wheel", handleWheel as EventListener);
        }
        return;
      }
    } else {
      // Scroll up - previous feature
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));

      if (activeIndex === 0) {
        if (sectionRef.current) {
          sectionRef.current.removeEventListener("wheel", handleWheel as EventListener);
        }
        return;
      }
    }

    // Unlock scrolling after a delay
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      scrollLocked.current = false;
    }, 500);

  };

  // Set up and clean up wheel event listener
  useEffect(() => {
    const section = sectionRef.current;
    console.log(1)

    if (section) {
      section.addEventListener("wheel", handleWheel as EventListener, {
        passive: false,
      });

      return () => {
        section.removeEventListener("wheel", handleWheel as EventListener);
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current);
        }
      };
    }
  }, [activeIndex]);

  // Scroll the active item into view when it changes
  useEffect(() => {
    console.log(activeIndex, 'activeIndex > 101')
    if (sectionRefs.current[activeIndex]) {
      sectionRefs.current[activeIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  return (
    <section ref={sectionRef} className="py-10 sm:py-12 md:py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20 font-lato font-bold text-[#131842] text-[28px] sm:text-[36px] md:text-[40px] lg:text-[44px] xl:text-[48px] 2xl:text-[50px] leading-[1.2] sm:leading-[52px] tracking-0 max-w-[90%] sm:max-w-[500px] md:max-w-[550px] lg:max-w-[600px] xl:max-w-[650px] 2xl:max-w-[630px] mx-auto">
          Keep your audience until the end
        </h2>

        {/* Mobile view - stacked layout */}
        <div className="flex flex-col md:hidden items-center gap-8">
          {/* Mobile image */}
          <motion.div
            key={`mobile-${activeIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex justify-center"
          >
            <img
              src={features[activeIndex].image}
              alt="Feature Visual"
              className="w-full max-w-[400px] h-auto aspect-video rounded-[20px] border-2 border-black bg-[#0FB492] shadow-[3px_3px_0_0_#000000] sm:shadow-[5px_5px_0_0_#000000]"
            />
          </motion.div>

          {/* Mobile slider navigation */}
          <div className="flex justify-center space-x-3 w-full my-4">
            {features.map((_, index) => (
              <div
                key={`mobile-dot-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`h-[8px] rounded-full cursor-pointer transition-all duration-300 ${
                  index === activeIndex
                    ? "w-[40px] bg-black"
                    : "w-[8px] bg-[#DDDDDD]"
                }`}
              ></div>
            ))}
          </div>

          {/* Mobile feature content */}
          <div className="text-center px-4">
            <div
              className={`w-14 h-14 mx-auto mb-4 rounded-full border-2 bg-white shadow-[3px_3px_0_0_#000000] flex items-center justify-center font-semibold`}
            >
              0{activeIndex + 1}
            </div>
            <h3 className="text-[24px] sm:text-[28px] font-bold mb-3">
              {features[activeIndex].title}
            </h3>
            <p className="text-[16px] sm:text-[18px] leading-[1.6] font-normal tracking-[-0.5px] text-black">
              {features[activeIndex].description}
            </p>
          </div>
        </div>

        {/* Desktop/tablet view - horizontal layout */}
        <div className="hidden md:flex items-start justify-between flex-col lg:flex-row gap-8">
          <div className="flex gap-6 md:gap-8 lg:gap-10 w-full lg:w-1/2">
            {/* Left slider */}
            <div className="hidden sm:flex flex-col gap-3">
              {features.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-[8px] h-[8px] rounded-[40px] cursor-pointer transition-all duration-300 ${
                    index === activeIndex ? "bg-black h-[80px]" : "bg-[#DDDDDD]"
                  }`}
                ></div>
              ))}
            </div>

            {/* Left Side data */}
            <div className="relative w-full flex flex-col items-start space-y-12 overflow-hidden max-h-[380px]">
              <div
                className="flex flex-col space-y-12 transition-transform duration-300"
                style={{ transform: `translateY(-${activeIndex * 144}px)` }}
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      sectionRefs.current[index] = el;
                    }}
                    className={`flex flex-col gap-3 cursor-pointer transition-opacity duration-300 ${
                      index === activeIndex ? "opacity-100" : "opacity-40"
                    }`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <div
                      className={`w-[50px] h-[44px] mb-2 rounded-full border-2 bg-white shadow-[5px_5px_0_0_#000000] flex items-center justify-center font-semibold transition-all duration-300 ${
                        index === activeIndex
                          ? "text-black border-black"
                          : "text-black border-black opacity-50"
                      }`}
                    >
                      0{index + 1}
                    </div>

                    <h3
                      className={`md:w-auto lg:w-[347px] h-auto md:h-8 text-[22px] md:text-[24px] lg:text-[28px] leading-[1.2] md:leading-8 font-bold transition-colors duration-300 ${
                        index === activeIndex ? "text-black" : "text-[#131842]"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`md:w-auto lg:w-[505px] h-auto lg:h-[96px] text-[16px] md:text-[18px] lg:text-[20px] leading-[1.6] md:leading-8 font-normal tracking-[-0.5px] transition-colors duration-300 ${
                        index === activeIndex ? "text-black" : "text-[#6D6D6D]"
                      }`}
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-1/2 flex justify-center items-center mt-6 lg:mt-0">
            <motion.img
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              src={features[activeIndex].image}
              alt="Feature Visual"
              className="w-full max-w-[640px] h-auto aspect-video rounded-[20px] md:rounded-[32px] border-2 border-black bg-[#0FB492] shadow-[3px_3px_0_0_#000000] md:shadow-[5px_5px_0_0_#000000]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
