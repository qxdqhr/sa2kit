"use client"

import * as React from "react"

import { cn } from "../utils"

type AvatarStatus = "idle" | "loaded" | "error"

const AvatarContext = React.createContext<{
  status: AvatarStatus
  setStatus: (next: AvatarStatus) => void
} | null>(null)

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const [status, setStatus] = React.useState<AvatarStatus>("idle")

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...(props as any)}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, onLoad, onError, ...props }, ref) => {
  const ctx = React.useContext(AvatarContext)

  return (
    <img
      ref={ref}
      className={cn(
        "aspect-square h-full w-full",
        ctx?.status === "error" ? "hidden" : undefined,
        className
      )}
      onLoad={(e) => {
        ctx?.setStatus("loaded")
        onLoad?.(e)
      }}
      onError={(e) => {
        ctx?.setStatus("error")
        onError?.(e)
      }}
      {...(props as any)}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(AvatarContext)
  const show = ctx?.status !== "loaded"

  if (!show) return null

  return (
    <span
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...(props as any)}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
