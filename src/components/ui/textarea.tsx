import * as React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  helperText?: string;
}

function Textarea({
  className,
  label,
  error,
  helperText,
  id,
  ...props
}: TextareaProps) {
  const reactId = useId();
  const inputId = id || reactId;

  const baseClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors bg-background text-foreground resize-none";
  const errorClasses = error
    ? "border-destructive focus:ring-destructive"
    : "border-input";

  if (!label && !error && !helperText) {
    // Simple textarea without wrapper
    return (
      <textarea
        data-slot="textarea"
        className={cn(baseClasses, errorClasses, className)}
        {...props}
      />
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-muted-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        data-slot="textarea"
        className={cn(baseClasses, errorClasses, className)}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export { Textarea };
