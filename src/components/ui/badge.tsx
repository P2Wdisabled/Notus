import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-md",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary border border-primary/20",
        purple: "bg-accent/10 text-accent border border-accent/20",
        success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
        warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
        danger: "bg-destructive/10 text-destructive border border-destructive/20",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        info: "bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200",
        outline: "text-foreground border border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  }
);

export interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
