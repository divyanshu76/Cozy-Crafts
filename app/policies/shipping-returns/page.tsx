import Link from "next/link";

export const metadata = {
  title: "Shipping & Returns | Cozy Craft",
  description: "Learn about our handcrafted shipping timelines, delivery, and returns policy.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="font-eagle-lake text-center text-4xl text-[var(--color-espresso)] sm:text-5xl">
        Shipping & Returns
      </h1>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-espresso)]">Shipping</h2>
        <p className="text-[var(--color-espresso-soft)] leading-relaxed">
          Orders are handmade in small batches and typically dispatched within 2–4 business days. Once shipped,
          delivery usually takes 3–6 business days depending on your location. You can check estimated delivery
          for your PIN code on any product page, and track a placed order anytime at{" "}
          <Link href="/track-order" className="underline hover:text-[var(--color-espresso)] font-medium">
            Track Order
          </Link>.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--color-espresso)]">Returns & Exchanges</h2>
        <p className="text-[var(--color-espresso-soft)] leading-relaxed">
          Since every piece is handmade, we accept returns only for items that arrive damaged or defective —
          reach out within 48 hours of delivery with a photo of the issue and we&apos;ll sort out a replacement or refund.
          Personalized items cannot be returned unless they arrive damaged.
        </p>
      </section>
    </div>
  );
}
