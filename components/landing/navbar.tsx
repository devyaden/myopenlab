"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/assets/global/app-logo-white.svg"
              alt="Olab Logo"
              width={90}
              height={90}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
            >
              Home
            </Link>
            <Link
              href="/features"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
            >
              Features
            </Link>
            <Link
              href="/roadmap"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
            >
              Roadmap
            </Link>
            <Link
              href="/feature-request"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
            >
              Request Feature
            </Link>
            <Link
              href="/contact"
              className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/authentication"
              className="px-4 py-2 text-yadn-foreground/90 hover:text-yadn-accent-green transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/authentication"
              className="px-4 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-yadn-foreground"
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
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/features"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/roadmap"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Roadmap
              </Link>
              <Link
                href="/feature-request"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Request Feature
              </Link>
              <Link
                href="/contact"
                className="text-yadn-foreground/80 hover:text-yadn-accent-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex space-x-4 pt-2">
                <Link
                  href="/authentication"
                  className="px-4 py-2 text-yadn-foreground/90 hover:text-yadn-accent-green transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/authentication"
                  className="px-4 py-2 bg-yadn-accent-green text-yadn-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
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
