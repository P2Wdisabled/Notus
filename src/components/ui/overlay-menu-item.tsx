import React from "react";
import { MenuItemProps } from "@/lib/types";

export default function MenuItem({ onClick, children, icon, className }: MenuItemProps) {
  return (
    <button
      className={`w-full flex flex-row items-center text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white ${className || ""}`}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="align-middle">{children}</span>
    </button>
  );
}