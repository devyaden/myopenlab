import Link from "next/link"
import { Linkedin, Youtube, Twitter, Globe } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#003329] text-white py-16 rounded-tl-[48px] rounded-tr-[48px]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo and tagline column */}
          <div>
            <div className="mb-6">
              <img className="w-[69px]" src='./assets/global/app-logo.png' alt='' />
            </div>
            <p className="text-sm mb-6">
              Fun, engaging
              <br />
              and authentic webinars
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <Youtube size={20} />
                <span className="sr-only">YouTube</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="hover:text-gray-300 transition-colors">
                <Globe size={20} />
                <span className="sr-only">Website</span>
              </Link>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h3 className="font-medium text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  HubSpot Integration
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  What's new
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Webinar Glossary
                </Link>
              </li>
            </ul>
          </div>

          {/* More column */}
          <div>
            <h3 className="font-medium text-lg mb-4">More</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Our story
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  We're hiring
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Contrast vs. Livestorm
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm hover:text-gray-300 transition-colors">
                  Contrast vs. Zoom
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
