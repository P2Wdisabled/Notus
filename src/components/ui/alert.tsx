import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "p-4 rounded-lg border",
  {
    variants: {
      variant: {
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
        success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
        warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
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

