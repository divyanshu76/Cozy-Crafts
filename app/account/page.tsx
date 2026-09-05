"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  // Simple stub for account page
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 min-h-[60vh]">
      <div className="mb-12">
        <h1 className="font-serif text-3xl md:text-4xl text-espresso mb-4">My Account</h1>
        <p className="text-espresso-soft">Welcome back. Manage your orders and details here.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 lg:col-span-3 space-y-2 border-r border-taupe/20 pr-4 hidden md:block">
          <Button variant="outline" className="w-full justify-start border-none bg-sage/5 text-sage">Order History</Button>
          <Button variant="outline" className="w-full justify-start border-none">Addresses</Button>
          <Button variant="outline" className="w-full justify-start border-none">Account Details</Button>
          <Button variant="outline" className="w-full justify-start border-none text-blush">Logout</Button>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          <h2 className="font-serif text-2xl text-espresso mb-6">Order History</h2>
          <div className="bg-cream-soft rounded-xl p-8 text-center border border-taupe/20">
            <p className="text-espresso-soft mb-4">You haven't placed any orders yet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
