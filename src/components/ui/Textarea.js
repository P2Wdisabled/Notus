import React from "react";

const Textarea = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none";
  const errorClasses = error
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600";
  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <textarea id={inputId} className={inputClasses} {...props} />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default Textarea;
