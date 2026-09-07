"use client"
import * as React from "react"
import { Clock } from "lucide-react"

export function OfferTimer({ offerEndAt }: { offerEndAt: string }) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
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

  if (isExpired) return null;

  return (
    <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg border border-red-100 mb-6">
      <Clock className="w-5 h-5 animate-pulse" />
      <span className="font-medium text-sm tracking-wide">Limited Time Offer ends in:</span>
      <div className="flex gap-1.5 font-mono text-sm font-bold">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
        <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
        <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
}
