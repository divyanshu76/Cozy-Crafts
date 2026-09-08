"use client"
import * as React from "react"
import { Clock } from "lucide-react"

export function OfferTimer({ offerEndAt, discountAmount }: { offerEndAt: string, discountAmount?: number }) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const end = new Date(offerEndAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(interval);
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [offerEndAt]);

  if (!mounted || isExpired) return null;

  return (
    <div className="flex flex-col gap-2 bg-[#FFF8F6] text-[#C44E3D] px-5 py-4 rounded-xl border border-[#FADCD9] mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🔥</span>
        <span className="font-bold text-[13px] uppercase tracking-widest text-[#B53E2D]">Limited-Time Offer</span>
      </div>
      
      {discountAmount && discountAmount > 0 && (
        <div className="font-semibold text-lg text-[#3E2C22]">
          Save ₹{discountAmount.toLocaleString("en-IN")}
        </div>
      )}
      
      <div className="flex flex-col gap-1 mt-1">
        <span className="text-sm font-medium text-[#6B5648]">Sale ends in</span>
        <div className="flex gap-2 font-mono text-lg font-bold text-[#3E2C22]">
          {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
          <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
          <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
          <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
        </div>
      </div>
    </div>
  );
}
