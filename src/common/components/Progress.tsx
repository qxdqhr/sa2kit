"use client"

import * as React from "react"

import { cn } from "../utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const safeMax = max <= 0 ? 100 : max
    const safeValue = Math.max(0, Math.min(value, safeMax))
    const percent = (safeValue / safeMax) * 100

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className
        )}
        {...(props as any)}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - percent}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
