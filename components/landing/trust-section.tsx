"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TrustSection() {
  const icons = [
    { src: "/icons/airbnb.png", link: "https://airbnb.com" },
    { src: "/icons/amazon.png", link: "https://amazon.com" },
    { src: "/icons/dropbox.png", link: "https://dropbox.com" },
    { src: "/icons/lyft.png", link: "https://lyft.com" },
    { src: "/icons/care.png", link: "https://care.com" },
    { src: "/icons/intercom.png", link: "https://intercom.com" },
  ];

  const innerIcons = [
    { src: "/icons/zoom.png", link: "https://zoom.us" },
    { src: "/icons/slack.png", link: "https://slack.com" },
    { src: "/icons/monkey.png", link: "https://mailchimp.com" },
  ];

  return (
    <section className="my-24 md:py-24 bg-white">
      <div className="container flex justify-between items-center mx-auto px-4">
        <div className="md:w-1/3 mb-12 md:mb-0">
          <h2 className="text-[48px] font-bold mb-4">
            Trusted by more than 50k companies
          </h2>
          <p className="text-gray-600 text-[20px]">
            We are trusted by more than 50 thousand companies worldwide. We
            provide the best support desk service ever.
          </p>
        </div>

        <div className="relative flex w-[600px] h-[600px] rounded-full bg-[#fff] border-[#EEF5FF] border-[3px]">
          {/* Outer Circle */}
          <div className="absolute top-[17%] left-[17%] w-[400px] h-[400px] rounded-full border border-[#E0E0E0] bg-[#EEF5FF]"></div>

          {/* Inner Circle */}
          <div className="absolute top-[30%] left-[30%] w-[240px] h-[240px] rounded-full border bg-white"></div>

          {/* Outer Icons */}
          {icons.map((icon, index) => {
            const angle = (index / icons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 600 / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            return (
              <a
                key={index}
                href={icon.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{
                  top: `calc(50% + ${y}px - 35px)`,
                  left: `calc(50% + ${x}px - 35px)`,
                }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className="w-[76px] h-[76px] rounded-full hover:scale-110 transition-transform bg-[#000]"
                />
              </a>
            );
          })}

          {/* Inner Icons */}
          {innerIcons.map((icon, index) => {
            const angle =
              (index / innerIcons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 200 / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            return (
              <a
                key={index}
                href={icon.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{
                  top: `calc(50% + ${y}px - 20px)`,
                  left: `calc(50% + ${x}px - 30px)`,
                }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className="w-[76px] h-[76px] rounded-full hover:scale-110 transition-transform bg-[#000]"
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
