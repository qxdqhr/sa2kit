"use client"

import * as React from "react"

import { cn } from "../utils"
import { mergeRefs, Portal, useControllableState, useOnClickOutside } from "./internal/ui-core"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  anchorRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Popover = ({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) => {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const anchorRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen: setIsOpen, triggerRef, anchorRef, contentRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, onClick, ...props }, ref) => {
    const ctx = React.useContext(PopoverContext)
    if (!ctx) return null

    const mergedRef = mergeRefs<HTMLButtonElement>(ctx.triggerRef, ref)

    const handleClick = (e: React.MouseEvent) => {
      ctx.setOpen(!ctx.open)
      onClick?.(e)
    }

    return (
      <button ref={mergedRef} type="button" onClick={handleClick} {...(props as any)}>
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverAnchor = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ ...props }, ref) => {
    const ctx = React.useContext(PopoverContext)
    return (
      <span
        ref={(node) => {
          if (ctx) ctx.anchorRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        {...(props as any)}
      />
    )
  }
)
PopoverAnchor.displayName = "PopoverAnchor"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, style, ...props }, ref) => {
    const ctx = React.useContext(PopoverContext)
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    const open = !!ctx?.open
    const anchor = ctx?.anchorRef.current ?? ctx?.triggerRef.current ?? null

    React.useLayoutEffect(() => {
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      let left = rect.left + rect.width / 2
      if (align === "start") left = rect.left
      if (align === "end") left = rect.right
      setPosition({ top: rect.bottom + sideOffset, left })
    }, [anchor, align, sideOffset])

    useOnClickOutside(
      [ctx?.contentRef ?? { current: null }, ctx?.triggerRef ?? { current: null }],
      () => ctx?.setOpen(false),
      open
    )

    if (!ctx || !open) return null

    return (
      <Portal>
        <div
          ref={mergeRefs(ctx.contentRef, ref)}
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            className
          )}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: align === "center" ? "translateX(-50%)" : align === "end" ? "translateX(-100%)" : undefined,
            ...style,
          }}
          {...(props as any)}
        />
      </Portal>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
