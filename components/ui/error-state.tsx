import * as React from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "./button"

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-taupe" />
      <h3 className="mb-2 font-serif text-xl font-medium text-espresso">Oops!</h3>
      <p className="mb-6 text-espresso-soft">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
