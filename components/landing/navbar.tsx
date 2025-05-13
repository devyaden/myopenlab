"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleFeaturesClick = (e: React.MouseEvent) => {
    scrollToFeatures(e);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-yadn-background/90 backdrop-blur-md py-2 shadow-lg"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/assets/global/app-logo-white.svg"
              alt="Olab Logo"
              width={90}
              height={90}
              className="w-[70px] sm:w-[80px] md:w-[90px]"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              href="/"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Home
            </Link>
            <button
              onClick={handleFeaturesClick}
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Features
            </button>
            <Link
              href="/roadmap"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Roadmap
            </Link>
            <Link
              href="/feature-request"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Request Feature
            </Link>
            <Link
              href="/contact"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <Link
              href="/auth/login"
              className="px-3 lg:px-4 py-2 text-yadn-foreground/90 hover:text-yadn-accent-green transition-colors text-sm lg:text-base"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-3 lg:px-4 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors text-sm lg:text-base"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-yadn-foreground p-2 hover:bg-yadn-foreground/10 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-yadn-background/95 backdrop-blur-md shadow-lg p-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <button
                onClick={handleFeaturesClick}
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors py-2 text-left"
              >
                Features
              </button>
              <Link
                href="/roadmap"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Roadmap
              </Link>
              <Link
                href="/feature-request"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Request Feature
              </Link>
              <Link
                href="/contact"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col space-y-3 pt-2 border-t border-yadn-foreground/10">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-yadn-foreground/90 hover:text-yadn-accent-green transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
