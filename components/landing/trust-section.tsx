"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function TrustSection() {
  const icons = [
    { src: "./assets/icons/airbnb.png", link: "https://airbnb.com" },
    { src: "./assets/icons/amazon.png", link: "https://amazon.com" },
    { src: "./assets/icons/dropbox.png", link: "https://dropbox.com" },
    { src: "./assets/icons/lyft.png", link: "https://lyft.com" },
    { src: "./assets/icons/care.png", link: "https://care.com" },
    { src: "./assets/icons/intercom.png", link: "https://intercom.com" },
  ];

  const innerIcons = [
    { src: "./assets/icons/zoom.png", link: "https://zoom.us" },
    { src: "./assets/icons/slack.png", link: "https://slack.com" },
    { src: "./assets/icons/monkey.png", link: "https://mailchimp.com" },
  ];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section id="trust" className="my-12 md:my-16 lg:my-24 py-8 md:py-16 lg:py-24 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center mx-auto px-4 gap-8 lg:gap-0">
        <motion.div
          className="w-full lg:w-1/3 mb-8 lg:mb-0 text-center lg:text-left"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-3xl md:text-4xl lg:text-[48px] md:leading-[56px] font-bold mb-4">
            Trusted by more than 50k companies
          </div>

          <p className="text-gray-600 text-base md:text-lg lg:text-[20px]">
            We are trusted by more than 50 thousand companies worldwide. We
            provide the best support desk service ever.
          </p>
        </motion.div>

        <motion.div
          className="relative flex w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:w-[600px] aspect-square rounded-full bg-[#fff] border-[#EEF5FF] border-[3px]"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="absolute top-[17%] left-[17%] w-[66%] h-[66%] rounded-full border border-[#E0E0E0] bg-[#EEF5FF]"></div>
          <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full border bg-white"></div>

          {/* Outer Icons */}
          {icons.map((icon, index) => {
            const angle = (index / icons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 50;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <motion.a
                key={index}
                href={icon.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{
                  top: `calc(50% + ${y}% - ${isMobile ? "20px" : "35px"})`,
                  left: `calc(50% + ${x}% - ${isMobile ? "20px" : "35px"})`,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ delay: index * 0.1 }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-[76px] lg:h-[76px] rounded-full transition-transform"
                />
              </motion.a>
            );
          })}

          {/* Inner Icons */}
          {innerIcons.map((icon, index) => {
            const angle = (index / innerIcons.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 18;
            const x = radius * Math.cos(angle);
            const y = 17 * Math.sin(angle);

            return (
              <motion.a
                key={index}
                href={icon.link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{
                  top: `calc(50% + ${y}% - ${isMobile ? "15px" : "20px"})`,
                  left: `calc(50% + ${x}% - ${isMobile ? "15px" : "30px"})`,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.15 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <img
                  src={icon.src}
                  alt="icon"
                  className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] lg:w-[76px] lg:h-[76px] rounded-full transition-transform"
                />
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
