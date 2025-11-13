"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "error" | "primary";
type Size = "sm" | "md" | "lg";

export interface StatusCircleProps extends React.ComponentProps<"div"> {
  variant?: StatusVariant;
  size?: Size;
  children?: React.ReactNode;
  label?: string;
}

export default function StatusCircle({
  variant = "primary",
  size = "md",
  className,
  children,
  label,
  ...props
}: StatusCircleProps) {
  const sizeCls = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const bgCls = variant === "success" ? "bg-success text-success-foreground" : variant === "error" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground";
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(sizeCls, "rounded-full flex items-center justify-center mx-auto", bgCls, className)}
      {...props}
    >
      {children}
    </div>
  );
}


