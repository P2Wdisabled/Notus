"use client";

import * as React from "react";
import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

function FilterModalOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-[var(--foreground)]/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function FilterModalContent({
  className,
  children,
  title,
  onClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title?: string;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Portal>
      <FilterModalOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {title && (
          <>
            <DialogPrimitive.Title className="sr-only">
              {title}
            </DialogPrimitive.Title>
            <header className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h2 className="text-2xl font-title font-bold text-[var(--foreground)]">
                {title}
              </h2>
            <DialogPrimitive.Close
              onClick={onClose}
              className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer disabled:pointer-events-none text-[var(--muted-foreground)] hover:text-[var(--primary)]"
              aria-label="Fermer"
            >
              <Icon name="x" className="h-6 w-6 text-current" aria-hidden="true" />
              <span className="sr-only">Fermer</span>
            </DialogPrimitive.Close>
          </header>
          </>
        )}
        {!title && (
          <DialogPrimitive.Title className="sr-only">
            Modal
          </DialogPrimitive.Title>
        )}
        <main className="overflow-y-auto scroller max-h-[calc(100vh-12rem)] -mx-1 px-1">
          {children}
        </main>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, children, title, className = "" }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FilterModalContent title={title} onClose={onClose} className={className}>
        {children}
      </FilterModalContent>
    </DialogPrimitive.Root>
  );
};

export default FilterModal;

