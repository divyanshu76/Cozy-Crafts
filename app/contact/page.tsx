import { Mail, Phone, MapPin } from "lucide-react";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const metadata = {
  title: "Contact Us | Cozy Craft",
  description: "Get in touch with Cozy Craft for custom orders, questions, or just to say hi.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-eagle-lake text-4xl text-[var(--color-espresso)] sm:text-5xl">Get in Touch</h1>
      <p className="mt-4 text-[var(--color-espresso-soft)]">
        Questions about an order, a custom request, or just want to say hi — we'd love to hear from you.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 text-[var(--color-espresso-soft)]">
        <a
          href="mailto:k7616168@gmail.com"
          className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)] transition-colors"
        >
          <Mail className="h-4 w-4" strokeWidth={1.5} /> k7616168@gmail.com
        </a>
        <a
          href="tel:+919999999999"
          className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)] transition-colors"
        >
          <Phone className="h-4 w-4" strokeWidth={1.5} /> +91 99999 99999
        </a>
        <p className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" strokeWidth={1.5} /> Ramaipatti, Mirzapur, 231001, Uttar Pradesh, India
        </p>
        <a
          href="https://www.instagram.com/cozycraftss.in/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Cozy Craft on Instagram"
          className="inline-flex items-center gap-2 hover:text-[var(--color-espresso)] transition-colors"
        >
          <InstagramIcon className="h-4 w-4" strokeWidth={1.5} /> @cozycraftss.in
        </a>
      </div>
    </div>
  );
}
