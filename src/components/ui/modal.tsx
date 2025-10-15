"use client";

import * as React from "react";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const Modal: React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Title: typeof ModalTitle;
  Description: typeof ModalDescription;
  Content: typeof ModalContent;
  Footer: typeof ModalFooter;
} = ({ isOpen, onClose, children, title, size = "md", className = "" }) => {
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

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${sizes[size]} ${className}`}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {title || "Modal"}
          </DialogTitle>
        </DialogHeader>
        {title && (
          <h2 className="text-2xl font-title font-bold text-center text-foreground mb-4">
            {title}
          </h2>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

const ModalHeader: React.FC<React.ComponentProps<"div">> = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const ModalTitle: React.FC<React.ComponentProps<"h3">> = ({ children, className = "", ...props }) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const ModalDescription: React.FC<React.ComponentProps<"p">> = ({ children, className = "", ...props }) => (
  <p
    className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}
    {...props}
  >
    {children}
  </p>
);

const ModalContent: React.FC<React.ComponentProps<"div">> = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const ModalFooter: React.FC<React.ComponentProps<"div">> = ({ children, className = "", ...props }) => (
  <div className={`mt-6 flex justify-end space-x-3 ${className}`} {...props}>
    {children}
  </div>
);

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Description = ModalDescription;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;

export default Modal;
export { ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };

