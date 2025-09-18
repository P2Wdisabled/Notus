"use client";

import React, { useEffect } from "react";

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  className = "",
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
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

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full ${sizes[size]} ${className}`}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const ModalTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const ModalDescription = ({ children, className = "", ...props }) => (
  <p
    className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}
    {...props}
  >
    {children}
  </p>
);

const ModalContent = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = "", ...props }) => (
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
