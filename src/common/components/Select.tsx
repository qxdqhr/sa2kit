"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "../utils"
import { mergeRefs, Portal, useControllableState, useOnClickOutside } from "./internal/ui-core"

interface SelectContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  value?: string
  setValue: (value: string) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  contentRef: React.RefObject<HTMLDivElement>
  itemsRef: React.MutableRefObject<Map<string, React.ReactNode>>
}

const SelectContext = React.createContext<SelectContextValue | null>(null)
const SelectGroupContext = React.createContext<boolean>(false)

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children: React.ReactNode
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [currentValue, setCurrentValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) {
        onValueChange?.(next)
      }
    },
  })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const itemsRef = React.useRef<Map<string, React.ReactNode>>(new Map())

  return (
    <SelectContext.Provider
      value={{
        open: disabled ? false : isOpen,
        setOpen: disabled ? () => undefined : setIsOpen,
        value: currentValue,
        setValue: (next) => {
          if (disabled) return
          setCurrentValue(next)
          setIsOpen(false)
        },
        triggerRef,
        contentRef,
        itemsRef,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => (
  <SelectGroupContext.Provider value={true}>{children}</SelectGroupContext.Provider>
)

const SelectValue = ({
  placeholder,
  children,
}: {
  placeholder?: React.ReactNode
  children?: React.ReactNode
}) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null
  if (children) return <>{children}</>
  if (ctx.value && ctx.itemsRef.current.has(ctx.value)) {
    return <>{ctx.itemsRef.current.get(ctx.value)}</>
  }
  return <span className="text-muted-foreground">{placeholder}</span>
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  if (!ctx) return null

  return (
    <button
      ref={mergeRefs(ctx.triggerRef, ref)}
      type="button"
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      onClick={(e) => {
        ctx.setOpen(!ctx.open)
        onClick?.(e)
      }}
      {...(props as any)}
    >
      <span>{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectScrollUpButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...(props as any)}
  >
    <ChevronUp className="h-4 w-4" />
  </div>
))
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...(props as any)}
  >
    <ChevronDown className="h-4 w-4" />
  </div>
))
SelectScrollDownButton.displayName = "SelectScrollDownButton"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "item-aligned" | "popper"
  }
>(({ className, children, style, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 })
  const open = !!ctx?.open
  const trigger = ctx?.triggerRef.current ?? null

  React.useLayoutEffect(() => {
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [trigger])

  useOnClickOutside(
    [ctx?.contentRef ?? { current: null }, ctx?.triggerRef ?? { current: null }],
    () => ctx?.setOpen(false),
    open
  )

  if (!ctx || !open || !trigger) return null

  return (
    <Portal>
      <div
        ref={mergeRefs(ctx.contentRef, ref)}
        className={cn(
          "relative z-50 max-h-80 overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
          className
        )}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          minWidth: Math.max(pos.width, 128),
          ...style,
        }}
        {...(props as any)}
      >
        <div className="p-1">{children}</div>
      </div>
    </Portal>
  )
})
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...(props as any)}
  />
))
SelectLabel.displayName = "SelectLabel"

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, onClick, ...props }, ref) => {
    const ctx = React.useContext(SelectContext)

    React.useEffect(() => {
      if (!ctx) return
      ctx.itemsRef.current.set(value, children)
      return () => {
        ctx.itemsRef.current.delete(value)
      }
    }, [ctx, value, children])

    if (!ctx) return null

    const selected = ctx.value === value

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        onClick={(e) => {
          ctx.setValue(value)
          onClick?.(e)
        }}
        {...(props as any)}
      >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          {selected ? <Check className="h-4 w-4" /> : null}
        </span>
        <span>{children}</span>
      </button>
    )
  }
)
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...(props as any)}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
