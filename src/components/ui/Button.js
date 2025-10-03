import React, { cloneElement, isValidElement } from "react";

const Button = ({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  asChild = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 font-title text-lg font-bold transition-all duration-200 cursor-pointer";

  const variants = {
    primary: "bg-orange dark:bg-dark-purple cursor-pointer hover:shadow-md shadow-light-gray dark:shadow-light-black",
    secondary: "border border-orange dark:border-dark-purple text-orange dark:text-dark-purple hover:shadow-md shadow-orange dark:shadow-dark-purple",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
    outline:
      "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500",
    ghost:
      "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500",
    link: "text-blue-600 hover:text-blue-700 underline focus:ring-blue-500",
  };


  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  if (asChild && isValidElement(children)) {
    const spinner = loading ? (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    ) : null;

    const mergedClassName = `${classes} ${children.props.className || ""}`.trim();

    return cloneElement(
      children,
      {
        className: mergedClassName,
        onClick,
        "aria-disabled": disabled || loading,
        ...props,
      },
      <>
        {spinner}
        {children.props.children}
      </>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
