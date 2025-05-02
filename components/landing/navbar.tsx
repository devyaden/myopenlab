"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img className="w-[69px]" src='./assets/global/app-logo.png' alt='' />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-10">
          <button
            onClick={() => scrollToSection("features")}
            className="text-base xl:text-lg  font-medium xl:font-semibold leading-none align-middle hover:text-green-500 transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-green-500 transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection("about")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-green-500 transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Videos
          </button>
          <Link
            href="#"
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-green-500 transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Learn
          </Link>
          <Link
            href="#"
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-green-500 transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Free Tools
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="#">
            <Button className="w-[125px] h-[44px] px-4 py-3   text-[#032A22] font-inter font-medium text-[16px] leading-[20px] tracking-[-0.5px] bg-transparent">
              Book a demo
            </Button>
          </Link>
          <Link href="#">
            <Button className="w-[125px] h-[44px] px-4 py-3 rounded-[10px]  border-[1px] border-[#032A22] text-[#FFFFFF] font-inter font-medium text-[16px] leading-[20px] tracking-[-0.5px] bg-[#0FB492] shadow-[2px_2px_0px_0px_#032A22] transition-all duration-300 ease-in-out hover:scale-105">
              Start for free
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <button
              onClick={() => scrollToSection("features")}
              className="py-2 hover:text-green-500 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="py-2 hover:text-green-500 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="py-2 hover:text-green-500 transition-colors"
            >
              About
            </button>
            <Link
              href="#"
              className="py-2 hover:text-green-500 transition-colors"
            >
              Contact
            </Link>
            <Link href="#">
              <Button className="bg-green-500 hover:bg-green-600 text-white w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
