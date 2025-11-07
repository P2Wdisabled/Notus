"use client";

import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";

interface FavoriteToggleProps {
  isFavorite: boolean;
  isAuthenticated: boolean;
  onToggleAuthenticated: (next: boolean) => void;
  className?: string;
  onRequireLogin?: () => void;
}

export default function FavoriteToggle({
  isFavorite,
  isAuthenticated,
  onToggleAuthenticated,
  className,
  onRequireLogin,
}: FavoriteToggleProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      try { onRequireLogin && onRequireLogin(); } catch {}
      return;
    }
    const next = !isFavorite;
    onToggleAuthenticated(next);
  };

  return (
    <button
        onClick={handleClick}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); }}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={cn(
          "inline-flex items-center justify-center h-10 w-10 rounded-md border transition-colors",
          isFavorite ? "bg-transparent border-none" : "bg-transparent border-none hover:bg-primary/10",
          className
        )}
      >
        <Icon name={isFavorite ? "favoriteSolid" : "favorite"} className={isFavorite ? "text-primary" : "text-muted-foreground"} />
    </button>
  );
}


