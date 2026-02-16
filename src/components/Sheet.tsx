"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../utils"
import {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogPortal as SheetPortal,
  DialogOverlay as SheetOverlay,
  DialogContent as BaseDialogContent,
} from "./Dialog"

const sheetVariants = cva(
  "fixed z-[10000] gap-4 bg-background p-6 shadow-lg transition ease-in-out translate-x-0 translate-y-0",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 left-0 border-b",
        bottom: "inset-x-0 bottom-0 left-0 border-t",
        left: "inset-y-0 left-0 top-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 top-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof BaseDialogContent>, "children">,
    VariantProps<typeof sheetVariants> {
  children?: React.ReactNode
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => (
    <BaseDialogContent
      ref={ref}
      className={cn(
        "max-w-none rounded-none",
        sheetVariants({ side }),
        className
      )}
      showCloseButton={false}
      {...(props as any)}
    >
      <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetClose>
      {children}
    </BaseDialogContent>
  )
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...(props as any)}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...(props as any)}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...(props as any)}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
