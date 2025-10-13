import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-card text-card-foreground rounded-2xl border border-border",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
);

export interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

function Card({ className, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("mb-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-36px font-title text-foreground", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("m-0 p-0", className)}
      {...props}
    />
  );
}

// Add legacy support
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
