import Link from "next/link";
import { Linkedin, Youtube, Twitter, Globe } from "lucide-react";

export default function Footer() {
  const footerLinkClass =
    "text-sm hover:text-gray-300 transition-colors text-white/70 font-medium";

  return (
    <footer className="bg-[#003329] text-white py-16 rounded-tl-[48px] rounded-tr-[48px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-evenly gap-10">
          {/* Logo and tagline */}
          <div>
            <div className="mb-6">
              <img
                className="w-[69px]"
                src="./assets/global/white-logo.png"
                alt="Logo"
              />
            </div>
            <p className="text-sm font-bold mb-6 leading-relaxed">
              Fun, engaging
              <br />
              and authentic webinars
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <img src='./assets/icons/in-white.png' alt=''  className="w-[20px]" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <img src='./assets/icons/youtube-white.png' alt=''  className="w-[20px]" />
                <span className="sr-only">YouTube</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
              <img src='./assets/icons/twitter-white.png' alt=''  className="w-[20px]" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
              <img src='./assets/icons/globe-white.png' alt=''  className="w-[20px]" />
                <span className="sr-only">Website</span>
              </Link>
            </div>
          </div>

          {/* Columns */}
          <div>
            <h3 className="font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              {["Features", "HubSpot Integration", "What's new", "Pricing", "Log in"].map((item) => (
                <li key={item}>
                  <Link href="#" className={footerLinkClass}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              {["Learn", "Videos", "Help Center", "Webinar Glossary"].map((item) => (
                <li key={item}>
                  <Link href="#" className={footerLinkClass}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">More</h3>
            <ul className="space-y-3">
              {[
                "Our story",
                "We're hiring",
                "Contrast vs. Livestorm",
                "Contrast vs. Zoom",
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className={footerLinkClass}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
