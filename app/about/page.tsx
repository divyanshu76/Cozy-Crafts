import Image from "next/image"

export const metadata = {
  title: "About Us | Cozy Craft",
  description: "The story behind our handmade gifts and tiny treasures.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="font-eagle-lake text-4xl md:text-5xl text-espresso mb-6">About Cozy Craft</h1>
        <p className="text-lg text-espresso-soft max-w-2xl mx-auto leading-relaxed">
          It started with a single pipe-cleaner flower on a tiny desk in Mumbai, and grew into a space for little things made with a lot of love.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div className="relative aspect-[4/5] md:aspect-square w-full rounded-2xl overflow-hidden bg-cream-soft">
          <Image 
            src="/products/placeholder.svg" 
            alt="Handcrafting process" 
            fill 
            className="object-cover" 
          />
        </div>
        <div className="space-y-6 text-lg text-espresso-soft leading-relaxed">
          <h2 className="font-serif text-3xl text-espresso mb-4">Slowly, Surely, Softly.</h2>
          <p>
            In a world of mass-produced plastic and next-day deliveries, we wanted to build something that takes its time. Every product you see here is made by hand, slowly, with attention to detail.
          </p>
          <p>
            We don't use factories. We don't buy ready-made stock to re-sell. We bend the wire, mix the resin, and tie the ribbons ourselves.
          </p>
          <p>
            Whether it's a fluffy charm for your backpack or a tiny bouquet for your best friend, we hope it brings a little bit of coziness to your day.
          </p>
        </div>
      </div>
    </div>
  )
}
