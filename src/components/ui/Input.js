"use client";
import React, { useId, useState } from "react";

const Input = ({
  label,
  error,
  helperText,
  className = "",
  id,
  enablePasswordToggle = false,
  noFocusRing = false,
  labelClassName = "",
  type = "text",
  endAdornment = null,
  ...props
}) => {
  const reactId = useId();
  const inputId = id || reactId;

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg transition-colors bg-white dark:bg-black text-black dark:text-white";
  const focusClasses = noFocusRing
    ? "focus:outline-none focus:ring-0 focus:ring-offset-0"
    : "focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple focus:border-transparent";
  const errorClasses = error
    ? "border-red-500 focus:ring-red-500"
    : "border-gray-300 dark:border-gray-600";
  const hasPasswordToggle = enablePasswordToggle && type === "password";
  const hasEndAdornment = Boolean(endAdornment);
  const inputPaddingClasses = hasPasswordToggle || hasEndAdornment ? "pr-10" : "";
  const inputClasses = `${baseClasses} ${focusClasses} ${errorClasses} ${inputPaddingClasses} ${className}`;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const computedType = type === "password" && isPasswordVisible ? "text" : type;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-dark-gray dark:text-gray ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input id={inputId} className={inputClasses} type={computedType} {...props} />
        {hasPasswordToggle && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((v) => !v)}
            aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-2 flex items-center text-dark-gray dark:text-gray hover:text-black dark:hover:text-white text-xs"
          >
            {isPasswordVisible ? "Masquer" : "Afficher"}
          </button>
        )}
        {hasEndAdornment && (
          <div
            className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-dark-gray dark:text-gray"
            aria-hidden="true"
          >
            {endAdornment}
          </div>
        )}
      </div>
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
