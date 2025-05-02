"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-20 pb-12 sm:pt-24 md:pt-32 lg:pt-40 md:pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-7xl font-bold leading-tight sm:leading-tight md:leading-tight lg:leading-[88px] tracking-[-0.0625rem] text-center mb-4 text-gray-900 font-lato">
            <div className="flex flex-col gap-2 sm:gap-4">
              <div>Visualize Your Ideas,</div>
              <div>Streamline Your Success!</div>
            </div>
          </h1>

          <p className="text-sm sm:text-base md:text-base lg:text-[17px] xl:text-[18px] 2xl:text-[19px] font-normal leading-relaxed sm:leading-relaxed md:leading-normal text-center text-gray-600 mb-6 sm:mb-8 mx-auto max-w-full sm:max-w-2xl md:max-w-3xl xl:max-w-5xl 2xl:max-w-[1200px] font-inter px-2 sm:px-4">
            Yadn is a powerful tool designed for creating flowcharts, mind maps,
            and organizational charts with ease. Whether you're mapping out
            complex processes, brainstorming ideas, or structuring teams, Yadn
            offers an intuitive drag-and-drop interface, smart connectors, and
            customizable templates to streamline your workflow. Perfect for
            professionals, educators, and teams, Yadn helps visualize ideas
            clearly and collaborate seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="#" className="w-full sm:w-auto mx-auto sm:mx-0">
              <Button
                className="bg-[#0FB492] text-white rounded-[10px] border-[1px] border-[#032A22] shadow-[2px_2px_0_0_#000000]
                px-4 py-3 h-[44px] w-full min-w-[164px] sm:w-[164px] gap-2
                xl:w-[180px] xl:h-[50px]
                2xl:w-[200px] 2xl:h-[56px]
                font-inter font-medium text-[15px] xs:text-[16px] sm:text-[18px] xl:text-[20px] 2xl:text-[22px] leading-[20px] tracking-[-0.5px]
                flex items-center justify-center
                transition-all duration-300 ease-in-out hover:scale-105 hover:border-2 hover:border-[#032A22]"
              >
                Start for free
              </Button>
            </Link>
            <Link href="#" className="w-full sm:w-auto mx-auto sm:mx-0">
              <Button
                className="bg-transparent text-[#032A22] border-[#032A22] border-[1px] px-4 py-3 h-[44px] w-full min-w-[164px] sm:w-[164px] rounded-[10px] flex items-center justify-center gap-2
                xl:h-[50px] xl:w-[180px] 2xl:h-[56px] 2xl:w-[200px] font-inter font-medium text-[15px] xs:text-[16px] sm:text-[18px] xl:text-[20px] 2xl:text-[22px] leading-[20px] tracking-[-0.5px]
                hover:bg-transparent hover:border-[#032A22] hover:text-[#032A22]"
              >
                Book a demo
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 sm:mt-10 md:mt-12 max-w-4xl mx-auto px-2 sm:px-0"
        >
          <Link href="#" className="block">
            <div className="relative aspect-video bg-[#C9ACAC] rounded-[20px] sm:rounded-[25px] md:rounded-[32px] overflow-hidden flex items-center justify-center border-[2px] border-black shadow-[3px_3px_0_0_#000000] sm:shadow-[4px_4px_0_0_#000000] md:shadow-[5px_5px_0_0_#000000]">
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#0FB492] rounded-full flex items-center justify-center border-none hover:bg-[#0FB492] hover:scale-110 transition-all duration-300 ease-in-out 
                  xl:w-[64px] xl:h-[64px] 2xl:w-[72px] 2xl:h-[72px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="white"
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                    style={{ marginLeft: "2px" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
