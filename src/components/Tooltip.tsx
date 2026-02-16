"use client"

import * as React from "react"

import { cn } from "../utils"
import { mergeRefs, Portal } from "./internal/ui-core"

const TooltipConfigContext = React.createContext<{ delayDuration: number }>({
  delayDuration: 200,
})

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLSpanElement | null>
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

const TooltipProvider = ({
  children,
  delayDuration = 200,
}: {
  children: React.ReactNode
  delayDuration?: number
}) => {
  return (
    <TooltipConfigContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipConfigContext.Provider>
  )
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { asChild?: boolean; children: React.ReactNode }
>(({ children, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext)
  const cfg = React.useContext(TooltipConfigContext)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  if (!ctx) return null

  const setRef = mergeRefs(ctx.triggerRef, ref)

  const openWithDelay = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => ctx.setOpen(true), cfg.delayDuration)
  }

  const closeNow = () => {
    if (timer.current) clearTimeout(timer.current)
    ctx.setOpen(false)
  }

  const shared = {
    onMouseEnter: openWithDelay,
    onMouseLeave: closeNow,
    onFocus: openWithDelay,
    onBlur: closeNow,
    ...props,
  }

  return (
    <span ref={setRef} {...(shared as any)}>
      {children}
    </span>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ className, sideOffset = 4, style, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  const open = !!ctx?.open
  const trigger = ctx?.triggerRef.current ?? null

  React.useLayoutEffect(() => {
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPos({
      top: rect.top - sideOffset,
      left: rect.left + rect.width / 2,
    })
  }, [trigger, sideOffset])

  if (!ctx || !open || !trigger) return null

  return (
    <Portal>
      <div
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
          className
        )}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: "translate(-50%, -100%)",
          ...style,
        }}
        {...(props as any)}
      />
    </Portal>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
