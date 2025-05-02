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
  const sectionRefs: any = useRef([]);

  return (
    <section className="flex flex-row lg:flex-col mx-auto py-16 px-4 gap-8">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-20 font-lato font-bold text-[#131842] text-[36px] sm:text-[38px] md:text-[40px] lg:text-[44px] xl:text-[48px] 2xl:text-[50px] leading-[52px] tracking-0 max-w-[90%] sm:max-w-[500px] md:max-w-[550px] lg:max-w-[600px] xl:max-w-[650px] 2xl:max-w-[630px] mx-auto">
          Keep your audience until the end
        </h2>
        <div className="flex items-start justify-between">
          <div className="flex gap-10">
            {/* Lefts slider */}
            <div className="flex flex-col gap-3">
              {features.map((item, index) => (
                <div
                  key={index}
                  onClick={()=>setActiveIndex(index)}
                  className={`w-[8px] h-[8px] rounded-[40px] cursor-pointer ${
                    index === activeIndex ? "bg-black h-[80px]" : "bg-[#DDDDDD]"
                  }`}
                ></div>
              ))}
            </div>

            {/* Left Side data */}
            <div className="relative w-full lg:w-1/2 flex flex-col items-start space-y-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  ref={(el) => (sectionRefs.current[index] = el)}
                  className="flex flex-col gap-3 cursor-pointer"
                  onClick={()=>setActiveIndex(index)}
                >
                  <div
                    className={`w-[50px] h-[44px] mb-2 rounded-full border-2 bg-white shadow-[5px_5px_0_0_#000000] flex items-center justify-center font-semibold ${
                      index === activeIndex
                        ? "text-black border-black opacity-100"
                        : "text-black border-black opacity-5"
                    }`}
                  >
                    0{index + 1}
                  </div>

                  <h3
                    className={`w-[347px] h-8 text-[28px] leading-8 font-bold ${
                      index === activeIndex
                        ? "text-black opacity-100"
                        : "text-[#131842] opacity-40"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`w-[505px] h-[96px] text-[20px] leading-8 font-normal tracking-[-0.5px] ${
                      index === activeIndex
                        ? "text-black opacity-100"
                        : "text-[#6D6D6D] opacity-40"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-1/2 flex justify-center items-center">
            <img
              src={features[activeIndex].image}
              alt="Feature Visual"
              className="w-[640px] h-[360px] rounded-[32px] border-2 border-black bg-[#0FB492] shadow-[5px_5px_0_0_#000000] transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
