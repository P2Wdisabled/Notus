import React from "react";
import { MenuItemProps } from "@/lib/types";

export default function MenuItem({ onClick, children, icon, className, disabled }: MenuItemProps) {
  return (
    <button
      className={`w-full flex flex-row items-center text-left px-3 py-2 rounded hover:bg-muted text-foreground ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ""}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="align-middle">{children}</span>
    </button>
  );
}