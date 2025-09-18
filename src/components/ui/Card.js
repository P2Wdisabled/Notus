import React from "react";

const Card = ({
  children,
  className = "",
  padding = "default",
  shadow = "default",
  ...props
}) => {
  const baseClasses =
    "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700";

  const paddingClasses = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    default: "shadow-xl",
    lg: "shadow-2xl",
  };

  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-xl font-bold text-gray-900 dark:text-white ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-gray-600 dark:text-gray-300 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "", ...props }) => (
  <div
    className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
