import * as LabelPrimitive from "@radix-ui/react-label"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface LabelProps extends React.ComponentPropsWithRef<typeof LabelPrimitive.Root> {
  children?: React.ReactNode
  className?: string
  htmlFor?: string
}

function Label({
  className,
  children,
  htmlFor,
  ...props
}: LabelProps) {
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </LabelPrimitive.Root>
  )
}

export { Label }