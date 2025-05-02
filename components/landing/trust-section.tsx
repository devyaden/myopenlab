"use client";

import { useEffect, useState } from "react";

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="my-12 md:my-16 lg:my-24 py-8 md:py-16 lg:py-24 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center mx-auto px-4 gap-8 lg:gap-0">
        <div className="w-full lg:w-1/3 mb-8 lg:mb-0 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4">
            Trusted by more than 50k companies
          </h2>
          <p className="text-gray-600 text-base md:text-lg lg:text-[20px]">
            We are trusted by more than 50 thousand companies worldwide. We
            provide the best support desk service ever.
          </p>
        </div>

        <div className="relative flex w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:w-[600px] aspect-square rounded-full bg-[#fff] border-[#EEF5FF] border-[3px]">
          {/* Outer Circle */}
          <div className="absolute top-[17%] left-[17%] w-[66%] h-[66%] rounded-full border border-[#E0E0E0] bg-[#EEF5FF]"></div>

          {/* Inner Circle */}
          <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full border bg-white"></div>

          {/* Outer Icons */}
          {icons.map((icon, index) => {
            const angle = (index / icons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 50; // percentage-based radius
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
                  top: `calc(50% + ${y}% - ${isMobile ? "20px" : "35px"})`,
                  left: `calc(50% + ${x}% - ${isMobile ? "20px" : "35px"})`,
                }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className={`w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-[76px] lg:h-[76px] rounded-full hover:scale-110 transition-transform bg-[#000]`}
                />
              </a>
            );
          })}

          {/* Inner Icons */}
          {innerIcons.map((icon, index) => {
            const angle =
              (index / innerIcons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 20; // percentage-based radius for inner circle
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
                  top: `calc(50% + ${y}% - ${isMobile ? "15px" : "20px"})`,
                  left: `calc(50% + ${x}% - ${isMobile ? "15px" : "30px"})`,
                }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className={`w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-[76px] lg:h-[76px] rounded-full hover:scale-110 transition-transform bg-[#000]`}
                />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
