import React from "react";

const Form = ({ children, onSubmit, className = "", ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

const FormGroup = ({ children, className = "", ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {children}
  </div>
);

const FormLabel = ({
  children,
  htmlFor,
  required = false,
  className = "",
  ...props
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const FormError = ({ children, className = "", ...props }) => (
  <p
    className={`text-sm text-red-600 dark:text-red-400 ${className}`}
    {...props}
  >
    {children}
  </p>
);

const FormHelperText = ({ children, className = "", ...props }) => (
  <p
    className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}
    {...props}
  >
    {children}
  </p>
);

const FormActions = ({ children, className = "", ...props }) => (
  <div className={`flex justify-end space-x-3 ${className}`} {...props}>
    {children}
  </div>
);

Form.Group = FormGroup;
Form.Label = FormLabel;
Form.Error = FormError;
Form.HelperText = FormHelperText;
Form.Actions = FormActions;

export default Form;
