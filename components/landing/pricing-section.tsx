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
    <section id="pricing" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex gap-8 justify-between items-center"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="w-[488px] h-[667px] rounded-[32px] bg-white border-2 border-[#032A22] shadow-[5px_5px_0px_0px_#032A22]"
            >
              <div className="p-6 flex flex-col justify-between items-start h-full">
                <div>
                  <h3 className="font-lato font-bold text-[48px] leading-[52px] text-left  text-black">
                    {plan.name}
                  </h3>

                  <p className="font-inter mt-4 font-normal text-[20px] leading-[160%] tracking-[-0.02em] text-left text-black">
                    {plan.subtitle}
                  </p>

                  <div className="mt-4 mb-6 flex items-baseline">
                    <span className="font-inter font-bold text-[38px] leading-[160%] tracking-[-0.02em] text-black">
                      ${plan.price}
                    </span>
                    <span className=" font-inter font-medium text-[18px] leading-[160%] tracking-[-0.02em] text-black text-center block">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start h-[37px]">
                      <Check className="h-8 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="font-medium text-[20px] leading-[160%] tracking-[-0.02em] font-inter">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="#" className="block">
                  <button
                    className={`w-[424px] h-[50px] px-4 py-3 rounded-[10px] text-center font-normal text-[16px] leading-[160%] tracking-[-0.02em] shadow-[2px_2px_0px_0px_#032A22] border border-[#032A22] font-inter transition-colors ${
                      plan.ctaColor === "green"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "hover:bg-gray-50 text-gray-800"
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
