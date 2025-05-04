"use client";

import { motion } from "framer-motion";

export default function TryNow() {
  return (
    <section className="pb-16 pt-4 md:pb-20" id="learn">
      <div className="container mx-auto px-4" id="previous-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[478px] mx-auto text-center font-lato font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[42px] 2xl:text-[48px] leading-tight sm:leading-[36px] md:leading-[42px] xl:leading-[48px] 2xl:leading-[52px] text-gray-900 mb-8 sm:mb-12 md:mb-16"
        >
          What Make Us Special
        </motion.h2>
        <img src="./assets/try-now-buy.png" alt="" />
      </div>
    </section>
  );
}
