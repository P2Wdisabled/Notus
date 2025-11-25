import React from "react";
import Icon, { type IconName } from "@/components/Icon";

type BadgeIconProps = {
  name: IconName;
  count?: number | undefined;
  className?: string;
};

export default function BadgeIcon({ name, count, className }: BadgeIconProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Icon name={name} className={className || "w-6 h-6"} />
      {typeof count === "number" && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-foreground text-sm font-semibold rounded-full min-w-4 h-4 flex items-center justify-center px-1.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}