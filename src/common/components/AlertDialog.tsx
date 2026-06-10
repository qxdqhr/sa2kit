"use client"

import * as React from "react"

import { cn } from "../utils"
import { buttonVariants } from "./Button"
import {
  Dialog as AlertDialog,
  DialogPortal as AlertDialogPortal,
  DialogOverlay as AlertDialogOverlay,
  DialogTrigger as AlertDialogTrigger,
  DialogContent as AlertDialogContentBase,
  DialogHeader as AlertDialogHeader,
  DialogFooter as AlertDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
  DialogClose,
} from "./Dialog"

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof AlertDialogContentBase>
>(({ className, ...props }, ref) => (
  <AlertDialogContentBase
    ref={ref}
    className={cn("z-[9999]", className)}
    {...(props as any)}
  />
))
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <DialogClose
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...(props as any)}
  />
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <DialogClose
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...(props as any)}
  />
))
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
