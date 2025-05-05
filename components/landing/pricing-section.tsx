"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  const plans = [
    {
      name: "Free",
      subtitle: "Try free for you",
      price: "0",
      period: "/month",
      features: [
        "3 members in 1 team",
        "3 file projects",
        "Team management",
        "Dedicated onboarding",
        "Support system everywhere",
      ],
      cta: "Start 7 Days Free Trial",
      popular: false,
      ctaColor: "white",
    },
    {
      name: "Team",
      subtitle: "Get your team together",
      price: "39",
      period: "/month",
      features: [
        "3 members in 1 team",
        "3 file projects",
        "Team management",
        "Dedicated onboarding",
        "Support system everywhere",
      ],
      cta: "Subscribe now",
      popular: true,
      ctaColor: "green",
    },
    {
      name: "Business",
      subtitle: "For large team & enterprise",
      price: "79",
      period: "/month",
      features: [
        "3 members in 1 team",
        "3 file projects",
        "Team management",
        "Dedicated onboarding",
        "Support system everywhere",
      ],
      cta: "Subscribe now",
      popular: false,
      ctaColor: "white",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section
      id="pricing"
      className="py-12 sm:py-16 md:py-20 lg:py-24 bg-[#F2FFFC]"
    >
      <div className="container mx-auto px-4 sm:px-6" id="next-section">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative w-full rounded-[20px] sm:rounded-[32px] bg-white border-2 border-[#032A22] shadow-[5px_5px_0px_0px_#032A22] ${
                plan.popular
                  ? "sm:transform sm:-translate-y-2 sm:scale-105 z-10"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-4 bg-yadn-accent-green text-white text-xs font-bold py-1 px-3 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                <div className="mb-5">
                  <h3 className="font-lato font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[48px] leading-tight text-black">
                    {plan.name}
                  </h3>

                  <p className="font-inter mt-2 font-normal text-base sm:text-lg md:text-[20px] leading-[160%] tracking-[-0.02em] text-black">
                    {plan.subtitle}
                  </p>

                  <div className="mt-3 mb-4 flex items-baseline">
                    <span className="font-inter font-bold text-2xl sm:text-3xl lg:text-[38px] leading-[160%] tracking-[-0.02em] text-black">
                      ${plan.price}
                    </span>
                    <span className="font-inter font-medium text-sm sm:text-base md:text-[18px] leading-[160%] tracking-[-0.02em] text-black text-center block">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base md:text-lg lg:text-[20px] leading-tight sm:leading-[160%] tracking-[-0.02em] font-inter">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="#" className="block w-full mt-auto">
                  <button
                    className={`w-full h-10 sm:h-12 px-4 rounded-[10px] text-center font-normal text-sm sm:text-[16px] leading-[160%] tracking-[-0.02em] shadow-[2px_2px_0px_0px_#032A22] border border-[#032A22] font-inter transition-colors ${
                      plan.ctaColor === "green"
                        ? "bg-yadn-accent-green hover:bg-yadn-accent-green/80 text-white"
                        : "hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
