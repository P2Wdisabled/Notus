"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface BackHeaderProps {
  href: string;
  title: string;
  className?: string;
}

export default function BackHeader({ href, title, className }: BackHeaderProps) {
  return (
    <header className={cn("flex items-center gap-4", className)}>
      <Link href={href} className="text-foreground font-semibold flex items-center" aria-label="Retour">
        <Icon name="arrowLeft" className="h-6 w-6 mr-2" />
      </Link>
      <h2 className="font-title text-4xl font-regular">{title}</h2>
    </header>
  );
}


