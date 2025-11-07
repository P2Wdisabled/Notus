"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ElementTag = keyof JSX.IntrinsicElements;

export interface PageCenterProps<TTag extends ElementTag = "main"> {
  as?: TTag;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  children: React.ReactNode;
}

export default function PageCenter<TTag extends ElementTag = "main">({
  as,
  className,
  maxWidth = "md",
  children,
}: PageCenterProps<TTag>) {
  const Comp: any = as || "main";
  const maxW = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <Comp className={cn("min-h-screen bg-background flex items-center justify-center p-4", className)}>
      <div className={cn(maxW, "w-full")}>{children}</div>
    </Comp>
  );
}


