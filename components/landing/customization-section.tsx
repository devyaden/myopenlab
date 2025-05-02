"use client"

import { motion } from "framer-motion"
import { History, Palette, Lightbulb, Smartphone, Shield } from 'lucide-react'

export default function CustomizationSection() {
  const features = [
    {
      icon: <History className="h-6 w-6 text-gray-900" />,
      title: "Version Control & History",
      description: "Track changes, revert to previous versions, and ensure a smooth workflow with automatic save and version history.",
    },
    {
      icon: <Palette className="h-6 w-6 text-gray-900" />,
      title: "Custom Styling & Themes",
      description: "Personalize diagrams with colors, fonts, and shapes to match your brand or project needs.",
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-gray-900" />,
      title: "AI-Powered Suggestions",
      description: "Get smart recommendations for optimizing flowcharts, improving layouts, and maintaining logical consistency.",
    },
    {
      icon: <Smartphone className="h-6 w-6 text-gray-900" />,
      title: "Multi-Device Access",
      description: "Access and edit your diagrams from desktop, tablet, or mobile for on-the-go productivity.",
    },
    {
      icon: <Shield className="h-6 w-6 text-gray-900" />,
      title: "Role-Based Permissions",
      description: "Control access levels for team members, ensuring secure collaboration with view-only, edit, or admin roles.",
    },
  ]

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:w-1/2"
          >
            <h2 className="text-3xl font-bold mb-8 text-center md:text-left">Keep your audience until the end</h2>
            
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:w-1/2 mt-8 md:mt-0"
          >
            <div className="bg-green-500 rounded-xl aspect-video"></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
