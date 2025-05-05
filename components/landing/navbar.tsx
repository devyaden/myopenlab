"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUser } from "@/lib/contexts/userContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

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
          <img className="w-[69px]" src="./assets/global/app-logo.png" alt="" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-10">
          <button
            onClick={() => scrollToSection("features")}
            className="text-base xl:text-lg  font-medium xl:font-semibold leading-none align-middle hover:text-yadn-accent-green transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-yadn-accent-green transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Pricing
          </button>
          <button
            onClick={() => scrollToSection("video")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-yadn-accent-green transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Videos
          </button>
          <button
            onClick={() => scrollToSection("learn")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-yadn-accent-green transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Learn
          </button>
          <button
            onClick={() => scrollToSection("trust")}
            className="text-base xl:text-lg font-medium xl:font-semibold leading-none align-middle hover:text-yadn-accent-green transition-colors"
            style={{ letterSpacing: "-0.5px" }}
          >
            Free Tools
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="#">
            <Button className="w-[125px] h-[44px] px-4 py-3 text-[#032A22] font-inter font-medium text-[16px] leading-[20px] tracking-[-0.5px] bg-transparent hover:bg-transparent">
              Book a demo
            </Button>
          </Link>
          {user ? (
            <Link href="/protected">
              <Button className="w-[125px] h-[44px] px-4 py-3 rounded-[10px]  border-[1px] border-yadn-accent-green text-[#FFFFFF] bg-yadn-accent-green font-inter font-medium text-[16px] leading-[20px] tracking-[-0.5px] bg-yadnyadn- shadow-[2px_2px_0px_0px_#032A22] transition-all duration-300 ease-in-out hover:scale-105 hover:bg-yadn-accent-green/80">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/authentication">
              <Button className="w-[125px] h-[44px] px-4 py-3 rounded-[10px]  border-[1px] border-yadn-accent-green text-[#FFFFFF] font-inter font-medium text-[16px] leading-[20px] tracking-[-0.5px] bg-yadn-accent-green shadow-[2px_2px_0px_0px_#032A22] transition-all duration-300 ease-in-out hover:scale-105 hover:bg-yadn-accent-green/80">
                Start for free
              </Button>
            </Link>
          )}
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
              Videos
            </button>
            <Link
              href="#"
              className="py-2 hover:text-green-500 transition-colors"
            >
              Learn
            </Link>
            <Link
              href="#"
              className="py-2 hover:text-green-500 transition-colors"
            >
              Free Tools
            </Link>
            {user ? (
              <Link href="/protected">
                <Button className="bg-green-500 hover:bg-green-600 text-white w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/authentication">
                <Button className="bg-green-500 hover:bg-green-600 text-white w-full">
                  Start for free
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
