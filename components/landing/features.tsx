"use client";

import { motion } from "framer-motion";
import { Hand, Clock, LayoutTemplate, Share2 } from "lucide-react";
import Link from "next/link";

export default function Features() {
  const features = [
    {
      icon: (
        <Hand className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-900" />
      ),
      title: "Drag-and-Drop Editor",
      description:
        "Easily create and customize flowcharts, org charts, and UML diagrams with an intuitive drag-and-drop interface.",
    },
    {
      icon: (
        <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-900" />
      ),
      title: "Collaboration & Real-Time Editing",
      description:
        "Seamlessly integrate with HMRC, accounting software for efficient payroll management.",
    },
    {
      icon: (
        <LayoutTemplate className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-900" />
      ),
      title: "Smart Auto-Layout & Templates",
      description:
        "Generate well-structured diagrams automatically or use ready-made templates to speed up the process.",
    },
    {
      icon: (
        <Share2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-900" />
      ),
      title: "Export & Integration",
      description:
        "Export diagrams in multiple formats (PNG, SVG, PDF) and integrate with tools like Slack, Jira, and Notion for a smooth workflow.",
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
    <section id="features" className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[478px] mx-auto text-center font-lato font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[42px] 2xl:text-[48px] leading-tight sm:leading-[36px] md:leading-[42px] xl:leading-[48px] 2xl:leading-[52px] text-gray-900 mb-8 sm:mb-12 md:mb-16"
        >
          What Make Us Special
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {features.map((feature, index) => (
            <Link href="#" key={index} className="block">
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center text-center hover:border-[2px] hover:border-black hover:shadow-[3px_3px_0_0_#000000] rounded-[12px] gap-4 sm:gap-6 md:gap-8 w-full h-full bg-[#F8F8F8] hover:bg-gray-50 transition-colors py-5 sm:py-6 md:py-7 px-3 sm:px-4 md:px-[16px]"
                whileHover={{ y: -5 }}
              >
                <div className="mb-2 sm:mb-3 md:mb-4 p-2 sm:p-3 rounded-full">
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="font-inter font-semibold text-[16px] sm:text-[18px] md:text-[22px] xl:text-[24px] 2xl:text-[26px] leading-tight sm:leading-[32px] xl:leading-[34px] 2xl:leading-[36px] tracking-[-0.32px] text-center text-[#131842]">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="font-inter font-normal text-[13px] sm:text-[14px] md:text-[16px] xl:text-[17px] 2xl:text-[18px] leading-tight sm:leading-[24px] md:leading-[28px] tracking-[-0.2px] text-[#6D6D6D] text-center">
                  {feature.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
