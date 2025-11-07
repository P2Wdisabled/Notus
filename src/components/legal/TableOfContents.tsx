"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TocItem { id: string; title: string }

export interface TableOfContentsProps extends React.ComponentProps<"nav"> {
  sections: TocItem[];
}

export default function TableOfContents({ sections, className, ...props }: TableOfContentsProps) {
  return (
    <nav className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2", className)} {...props}>
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
        >
          {section.title}
        </a>
      ))}
    </nav>
  );
}


