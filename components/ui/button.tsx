"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, isLoading, children, disabled, onClick, ...props }, ref) => {
    const { pending } = useFormStatus();
    const [isInternalLoading, setIsInternalLoading] = React.useState(false);
    
    // Auto-detect loading if in a form and submitting
    const isFormLoading = props.type === "submit" && pending;
    const isEffectivelyLoading = isLoading || isFormLoading || isInternalLoading;
    const isEffectivelyDisabled = disabled || isEffectivelyLoading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        const result = onClick(e) as any;
        if (result && typeof result === "object" && "then" in result) {
          setIsInternalLoading(true);
          try {
            await result;
          } finally {
            setIsInternalLoading(false);
          }
        }
      }
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-[1px]",
          {
            "bg-sage text-white hover:bg-sage-deep": variant === "default",
            "bg-blush text-espresso hover:bg-blush-deep": variant === "secondary",
            "border border-taupe bg-transparent hover:bg-cream-soft text-espresso": variant === "outline",
            "hover:bg-cream-soft text-espresso hover:text-espresso": variant === "ghost",
            "text-sage underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        disabled={isEffectivelyDisabled}
        onClick={handleClick}
        {...props}
      >
        {isEffectivelyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
