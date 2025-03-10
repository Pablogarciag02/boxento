import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentPropsWithRef<"input"> {
  className?: string
  type?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  value?: string | number
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  min?: string
  max?: string
  maxLength?: number
  ref?: React.RefObject<HTMLInputElement>
}

function Input({ 
  className, 
  type,
  id,
  placeholder,
  required,
  disabled,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  min,
  max,
  maxLength,
  ref,
  ...props 
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      value={value}
      onChange={onChange}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
      min={min}
      max={max}
      maxLength={maxLength}
      ref={ref}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }