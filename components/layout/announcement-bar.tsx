"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

const messages = [
  "Free delivery on orders over ₹499",
  "Handmade in small batches with love",
  "Add a personalized gift note at checkout"
]

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-sage text-white text-xs font-medium py-2 text-center overflow-hidden relative h-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {messages[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
