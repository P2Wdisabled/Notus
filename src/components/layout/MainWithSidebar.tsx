"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MainWithSidebarProps extends React.ComponentProps<"div"> {}

export default function MainWithSidebar({ className, children, ...props }: MainWithSidebarProps) {
  return (
    <div className={cn("md:ml-64 md:pl-4", className)} {...props}>
      {children}
    </div>
  );
}


