import Image from "next/image"

export const metadata = {
  title: "About Us | Cozy Craft",
  description: "The story behind our handmade gifts and tiny treasures.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-4xl">
      {/* Scroll-reveal keyframe + prefers-reduced-motion override */}
      <style>{`
        @keyframes cc-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cc-reveal {
          animation: cc-fade-up 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .cc-reveal { animation: none; }
        }
      `}</style>

      <div className="text-center mb-16">
        <h1 className="font-eagle-lake text-4xl md:text-5xl text-espresso mb-6">About Cozy Craft</h1>
        <p className="text-lg text-espresso-soft max-w-2xl mx-auto leading-relaxed">
          It started with a single pipe-cleaner flower on a tiny desk in Mumbai, and grew into a space for little things made with a lot of love.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        {/* Image container — group enables the child hover scale */}
        <div
          className="cc-reveal group relative aspect-[4/5] md:aspect-square w-full rounded-2xl overflow-hidden bg-cream-soft"
          style={{ animationDelay: "0.1s" }}
        >
          <Image
            src="/assets/About-Section.png"
            alt="Hands carefully crafting a handmade Cozy Craft piece — the making process"
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>

        {/* Text */}
        <div
          className="cc-reveal space-y-6 text-lg text-espresso-soft leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="font-serif text-3xl text-espresso mb-4">Slowly, Surely, Softly.</h2>
          <p>
            In a world of mass-produced plastic and next-day deliveries, we wanted to build something that takes its time. Every product you see here is made by hand, slowly, with attention to detail.
          </p>
          <p>
            We don&apos;t use factories. We don&apos;t buy ready-made stock to re-sell. We bend the wire, mix the resin, and tie the ribbons ourselves.
          </p>
          <p>
            Whether it&apos;s a fluffy charm for your backpack or a tiny bouquet for your best friend, we hope it brings a little bit of coziness to your day.
          </p>
        </div>
      </div>
    </div>
  )
}

