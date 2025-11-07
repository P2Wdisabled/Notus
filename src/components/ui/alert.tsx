import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "p-4 rounded-lg border",
  {
    variants: {
      variant: {
        info: "bg-muted border-border text-foreground",
        success: "bg-success/10 border-success/20 text-success",
        warning: "bg-warning/10 border-warning/20 text-warning",
        error: "bg-destructive/10 border-destructive/20 text-destructive",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

const Alert: React.FC<AlertProps> & {
  Title: typeof AlertTitle;
  Description: typeof AlertDescription;
} = ({ children, variant, className, ...props }) => {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
};

const AlertTitle: React.FC<React.ComponentProps<"h4">> = ({ children, className = "", ...props }) => (
  <h4 className={cn("font-semibold mb-1", className)} {...props}>
    {children}
  </h4>
);

const AlertDescription: React.FC<React.ComponentProps<"p">> = ({ children, className = "", ...props }) => (
  <p className={cn("text-sm", className)} {...props}>
    {children}
  </p>
);

Alert.Title = AlertTitle;
Alert.Description = AlertDescription;

export default Alert;
export { AlertTitle, AlertDescription, alertVariants };

