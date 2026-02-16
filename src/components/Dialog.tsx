"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "../utils"
import { mergeRefs, Portal, useControllableState, useOnClickOutside } from "./internal/ui-core"

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, defaultOpen = false, onOpenChange, children }: DialogProps) => {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen, triggerRef, contentRef }}>
      {children}
    </DialogContext.Provider>
  )
}

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ children, onClick, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    if (!ctx) return null

    const mergedRef = mergeRefs<HTMLButtonElement>(ctx.triggerRef, ref)

    const handleClick = (e: React.MouseEvent) => {
      ctx.setOpen(true)
      onClick?.(e)
    }

    return (
      <button ref={mergedRef} type="button" onClick={handleClick} {...(props as any)}>
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  const ctx = React.useContext(DialogContext)
  if (!ctx?.open) return null
  return <Portal>{children}</Portal>
}

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const ctx = React.useContext(DialogContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        ctx?.setOpen(false)
        onClick?.(e)
      }}
      {...(props as any)}
    />
  )
})
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(DialogContext)
  if (!ctx?.open) return null
  return (
    <div
      ref={ref}
      className={cn("fixed inset-0 z-[9999] bg-black/80", className)}
      {...(props as any)}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onPointerDownOutside?: (event: PointerEvent) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  showCloseButton?: boolean
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onPointerDownOutside, onEscapeKeyDown, showCloseButton = true, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    const open = !!ctx?.open

    useOnClickOutside(
      [ctx?.contentRef ?? { current: null }, ctx?.triggerRef ?? { current: null }],
      (evt) => {
        onPointerDownOutside?.(evt as PointerEvent)
        if (!(evt as Event).defaultPrevented) {
          ctx?.setOpen(false)
        }
      },
      open
    )

    React.useEffect(() => {
      if (!open) return
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return
        onEscapeKeyDown?.(e)
        if (!e.defaultPrevented) {
          ctx?.setOpen(false)
        }
      }
      document.addEventListener("keydown", onKey)
      return () => document.removeEventListener("keydown", onKey)
    }, [ctx, onEscapeKeyDown, open])

    if (!ctx || !open) return null

    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          ref={mergeRefs(ctx.contentRef, ref)}
          className={cn(
            "fixed left-[50%] top-[50%] z-[10000] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            className
          )}
          {...(props as any)}
        >
          {children}
          {showCloseButton ? (
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          ) : null}
        </div>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...(props as any)}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...(props as any)}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...(props as any)}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...(props as any)}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
