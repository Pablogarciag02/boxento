"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface DialogProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Root> {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function Dialog({
  children,
  open,
  onOpenChange,
  ...props
}: DialogProps) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} data-slot="dialog" {...props}>{children}</DialogPrimitive.Root>
}

export interface DialogTriggerProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Trigger> {
  children?: React.ReactNode
  className?: string
}

function DialogTrigger({
  children,
  className,
  ...props
}: DialogTriggerProps) {
  return <DialogPrimitive.Trigger className={className} data-slot="dialog-trigger" {...props}>{children}</DialogPrimitive.Trigger>
}

export interface DialogPortalProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Portal> {
  children?: React.ReactNode
}

function DialogPortal({
  children,
  ...props
}: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props}>{children}</DialogPrimitive.Portal>
}

export interface DialogCloseProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Close> {
  children?: React.ReactNode
  className?: string
}

function DialogClose({
  children,
  className,
  ...props
}: DialogCloseProps) {
  return <DialogPrimitive.Close className={className} data-slot="dialog-close" {...props}>{children}</DialogPrimitive.Close>
}

export interface DialogOverlayProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Overlay> {
  className?: string
}

function DialogOverlay({
  className,
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  )
}

export interface DialogContentProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Content> {
  children?: React.ReactNode
  className?: string
}

function DialogContent({
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  className?: string
}

function DialogFooter({ className, children, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface DialogTitleProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Title> {
  children?: React.ReactNode
  className?: string
}

function DialogTitle({
  className,
  children,
  ...props
}: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
}

export interface DialogDescriptionProps extends React.ComponentPropsWithRef<typeof DialogPrimitive.Description> {
  children?: React.ReactNode
  className?: string
}

function DialogDescription({
  className,
  children,
  ...props
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}