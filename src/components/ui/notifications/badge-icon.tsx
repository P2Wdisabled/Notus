import React from "react";
import Icon, { type IconName } from "@/components/Icon";

type BadgeIconProps = {
  name: IconName;
  count?: number | undefined;
};

export default function BadgeIcon({ name, count }: BadgeIconProps) {
  return (
    <div className="relative inline-flex">
      <Icon name={name} className="w-6 h-6" />
      {typeof count === "number" && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-foreground text-sm font-semibold rounded-full min-w-4 h-4 flex items-center justify-center px-1.5">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}