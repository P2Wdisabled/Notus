import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import Icon from "@/components/Icon"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-lg font-title font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-0 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground cursor-pointer hover:shadow-md hover:bg-primary/90",
        secondary: "border border-primary text-primary hover:shadow-md hover:bg-primary/10",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
        outline: "border border-input text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:shadow-md hover:border-primary hover:bg-foreground/5 border border-primary",
        ghostPurple: "bg-background text-foreground border border-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "p-1.5",
        sm: "p-1 text-sm",
        lg: "p-2 text-xl",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Icon name="spinner" className="animate-spin -ml-1 mr-2 h-4 w-4" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
