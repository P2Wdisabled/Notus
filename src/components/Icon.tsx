"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type IconName = "favorite";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
  filled?: boolean;
}

export default function Icon({ name, className, filled = false, ...rest }: IconProps) {
  if (name === "favorite") {
    return (
      <svg
        {...rest}
        className={cn("w-5 h-5", className)}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    );
  }

  return null;
}


