export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-espresso mb-8">Settings</h1>
      <div className="bg-white rounded-xl border border-taupe/20 shadow-sm p-8 max-w-lg">
        <h2 className="font-semibold text-espresso mb-2">Store Settings</h2>
        <p className="text-sm text-espresso-soft mb-6">
          Configuration options will appear here in a future update.
          For now, manage store configuration directly in Supabase.
        </p>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-cream-soft rounded-lg border border-taupe/20">
            <p className="font-medium text-espresso mb-1">Webhook URL</p>
            <p className="font-mono text-xs text-espresso-soft break-all">
              https://yourdomain.com/api/webhooks/razorpay
            </p>
            <p className="text-xs text-taupe mt-1">
              Register this in your Razorpay dashboard → Webhooks.
              Subscribe to: <code>payment.captured</code>, <code>payment.failed</code>
            </p>
          </div>

          <div className="p-4 bg-cream-soft rounded-lg border border-taupe/20">
            <p className="font-medium text-espresso mb-1">Free Shipping Threshold</p>
            <p className="text-espresso-soft">₹499 — edit in <code>/app/api/checkout/create-order/route.ts</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
