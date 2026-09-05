export const metadata = {
  title: "Privacy Policy | Cozy Craft",
  description: "Privacy policy and data practices for Cozy Craft.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="font-eagle-lake text-center text-4xl text-[var(--color-espresso)] sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-center text-sm text-[var(--color-espresso-soft)]">Last updated: September 2026</p>

      <div className="mt-10 space-y-6 text-[var(--color-espresso-soft)] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-espresso)]">What we collect</h2>
          <p>Name, email, phone number, and delivery address when you place an order or contact us.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-espresso)]">How we use it</h2>
          <p>To process and deliver your order, send order updates, and respond to your questions. We don&apos;t sell your data.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-espresso)]">Third parties we work with</h2>
          <p>Razorpay (payments), Shiprocket (shipping), Resend (order emails), and Supabase (secure data storage).</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-espresso)]">Contact</h2>
          <p>
            Questions about your data — email{" "}
            <a href="mailto:k7616168@gmail.com" className="underline hover:text-[var(--color-espresso)]">
              k7616168@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
