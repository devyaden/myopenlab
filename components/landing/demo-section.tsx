"use client"

import { motion } from "framer-motion"

export default function DemoSection() {
  return (
    <section id="demo" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Try Now | Buy Later</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-2 border-b border-gray-200">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-3 border-r border-gray-200 pr-4">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-8 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 md:col-span-9">
                <div className="flex mb-4 space-x-2 overflow-x-auto pb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
                    <div key={item} className="h-8 w-8 flex-shrink-0 bg-gray-100 rounded">
                      {item === 6 && (
                        <div className="w-full h-full bg-purple-500 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-12 bg-gray-100 rounded flex items-center px-4">
                      <div className="w-4 h-4 bg-gray-300 rounded mr-4"></div>
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
