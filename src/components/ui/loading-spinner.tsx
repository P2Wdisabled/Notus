import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> & {
  Page: typeof LoadingPage;
  Card: typeof LoadingCard;
} = ({ size = "md", className = "", ...props }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const classes = cn(
    "animate-spin rounded-full border-b-2 border-blue-600",
    sizes[size],
    className
  );

  return <div className={classes} {...props}></div>;
};

export interface LoadingPageProps extends React.ComponentProps<"div"> {
  message?: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message = "Chargement...",
  className = "",
  ...props
}) => (
  <div
    className={cn(
      "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center",
      className
    )}
    {...props}
  >
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  </div>
);

const LoadingCard: React.FC<LoadingPageProps> = ({
  message = "Chargement...",
  className = "",
  ...props
}) => (
  <div
    className={cn(
      "bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center",
      className
    )}
    {...props}
  >
    <LoadingSpinner size="lg" className="mx-auto mb-4" />
    <p className="text-gray-600 dark:text-gray-300">{message}</p>
  </div>
);

LoadingSpinner.Page = LoadingPage;
LoadingSpinner.Card = LoadingCard;

export default LoadingSpinner;
export { LoadingPage, LoadingCard };

