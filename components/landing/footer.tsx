import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-yadn-background/50 border-t border-yadn-foreground/10 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/assets/global/app-logo-white.svg"
                alt="Olab Logo"
                width={120}
                height={100}
              />
            </Link>
            <p className="text-yadn-foreground/70 text-sm">
              Visual collaboration made simple. Create, connect, and collaborate
              with our powerful diagramming tool.
            </p>
          </div>

          <div>
            <h3 className="text-yadn-foreground font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmap"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-yadn-foreground font-semibold mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/tutorials"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Tutorials
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-yadn-foreground font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-yadn-foreground/70 hover:text-yadn-accent-green text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-yadn-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-yadn-foreground/60 text-sm">
            &copy; {new Date().getFullYear()} Olab. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-yadn-foreground/60 hover:text-yadn-accent-green transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-yadn-foreground/60 hover:text-yadn-accent-green transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
