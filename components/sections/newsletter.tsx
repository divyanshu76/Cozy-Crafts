"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { fadeUp } from "@/lib/motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { protestRevolution } from "@/lib/fonts"
import { cn } from "@/lib/utils"

export function Newsletter() {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setStatus("loading")
    setTimeout(() => {
      setStatus("success")
      setEmail("")
    }, 1000)
  }

  return (
    <section className="py-16 md:py-24 bg-sage relative overflow-hidden">
      {/* Decorative loops/background elements could go here */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className={cn("text-3xl md:text-4xl text-white mb-4", protestRevolution.className)}>Join our little world</h2>
          <p className="text-white/80 mb-8 text-lg">
            Sign up for updates on new small batches, behind-the-scenes, and get 10% off your first order.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" suppressHydrationWarning>
            <Input 
              type="email" 
              placeholder="Your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white"
              required
              disabled={status !== "idle"}
            />
            <Button 
              type="submit" 
              disabled={status !== "idle"}
              className="bg-white text-sage hover:bg-cream-soft min-w-[120px]"
            >
              {status === "loading" ? "Joining..." : status === "success" ? "Welcome!" : "Sign up"}
            </Button>
          </form>
          {status === "success" && (
            <p className="text-white text-sm mt-4">Check your inbox for your 10% off code!</p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
