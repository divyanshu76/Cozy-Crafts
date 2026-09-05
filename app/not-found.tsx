import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <p className="font-serif text-6xl text-espresso">404</p>
      <p className="text-espresso-soft">
        We couldn't find that page — but there's plenty more to see.
      </p>
      <Link
        href="/shop"
        className="mt-2 rounded-full bg-espresso px-6 py-3 text-sm font-medium text-cream transition-opacity hover:opacity-90"
      >
        Shop Handmade
      </Link>
    </div>
  );
}
