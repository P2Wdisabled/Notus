"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DocumentsGridProps extends React.ComponentProps<"ul"> {}

export default function DocumentsGrid({ className, children, ...props }: DocumentsGridProps) {
  return (
    <ul className={cn("grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]", className)} {...props}>
      {children}
    </ul>
  );
}

export const documentsGridClass = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]";



