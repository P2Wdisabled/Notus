import React from "react";

const Alert = ({ children, variant = "info", className = "", ...props }) => {
  const baseClasses = "p-4 rounded-lg border";

  const variants = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = "", ...props }) => (
  <h4 className={`font-semibold mb-1 ${className}`} {...props}>
    {children}
  </h4>
);

const AlertDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm ${className}`} {...props}>
    {children}
  </p>
);

Alert.Title = AlertTitle;
Alert.Description = AlertDescription;

export default Alert;
