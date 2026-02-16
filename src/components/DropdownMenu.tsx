"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../utils"
import { mergeRefs, Portal, useControllableState, useOnClickOutside } from "./internal/ui-core"

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)
const DropdownMenuRadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
} | null>(null)

interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const DropdownMenu = ({ open, defaultOpen = false, onOpenChange, children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen: setIsOpen, triggerRef, contentRef }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; children: React.ReactNode }
>(({ children, onClick, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuContext)
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
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <Portal>{children}</Portal>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ className, sideOffset = 4, style, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuContext)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })
  const open = !!ctx?.open
  const trigger = ctx?.triggerRef.current ?? null

  React.useLayoutEffect(() => {
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPos({ top: rect.bottom + sideOffset, left: rect.left })
  }, [trigger, sideOffset])

  useOnClickOutside(
    [ctx?.contentRef ?? { current: null }, ctx?.triggerRef ?? { current: null }],
    () => ctx?.setOpen(false),
    open
  )

  if (!ctx || !open || !trigger) return null

  return (
    <DropdownMenuPortal>
      <div
        ref={mergeRefs(ctx.contentRef, ref)}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        style={{ position: "fixed", top: pos.top, left: pos.left, ...style }}
        {...(props as any)}
      />
    </DropdownMenuPortal>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

type SelectEventLike = Event & { preventDefault: () => void; defaultPrevented: boolean }

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    inset?: boolean
    onSelect?: (event: SelectEventLike) => void
  }
>(({ className, inset, onSelect, onClick, ...props }, ref) => {
  const ctx = React.useContext(DropdownMenuContext)
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        className
      )}
      onClick={(e) => {
        onSelect?.(e.nativeEvent as SelectEventLike)
        onClick?.(e)
        if (!e.isDefaultPrevented()) {
          ctx?.setOpen(false)
        }
      }}
      {...(props as any)}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, children, checked = false, onCheckedChange, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    onClick={(e) => {
      onCheckedChange?.(!checked)
      onClick?.(e)
    }}
    {...(props as any)}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked ? <Check className="h-4 w-4" /> : null}
    </span>
    {children}
  </button>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioGroup = ({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) => (
  <DropdownMenuRadioGroupContext.Provider value={{ value, onValueChange }}>
    {children}
  </DropdownMenuRadioGroupContext.Provider>
)

const DropdownMenuRadioItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, children, value, onClick, ...props }, ref) => {
  const radioCtx = React.useContext(DropdownMenuRadioGroupContext)
  const menuCtx = React.useContext(DropdownMenuContext)
  const checked = radioCtx?.value === value
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(e) => {
        radioCtx?.onValueChange?.(value)
        onClick?.(e)
        menuCtx?.setOpen(false)
      }}
      {...(props as any)}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Circle className="h-2 w-2 fill-current" /> : null}
      </span>
      {children}
    </button>
  )
})
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...(props as any)}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...(props as any)}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
    {...(props as any)}
  />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent",
      inset && "pl-8",
      className
    )}
    {...(props as any)}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </button>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
      className
    )}
    {...(props as any)}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
