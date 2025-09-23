import React from "react";

const Input = ({ label, error, helperText, className = "", id, ...props }) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple focus:border-transparent transition-colors bg-white dark:bg-black text-black dark:text-white";
  const errorClasses = error
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600";
  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-dark-gray dark:text-gray"
        >
          {label}
        </label>
      )}
      <input id={inputId} className={inputClasses} {...props} />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-dark-gray dark:text-light-gray">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
