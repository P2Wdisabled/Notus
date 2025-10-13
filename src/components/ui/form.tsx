import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormProps extends React.ComponentProps<"form"> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const Form: React.FC<FormProps> & {
  Group: typeof FormGroup;
  Label: typeof FormLabel;
  Error: typeof FormError;
  HelperText: typeof FormHelperText;
  Actions: typeof FormActions;
} = ({ children, onSubmit, className = "", ...props }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </form>
  );
};

const FormGroup: React.FC<React.ComponentProps<"div">> = ({ children, className = "", ...props }) => (
  <div className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
);

export interface FormLabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = "",
  ...props
}) => (
  <label
    htmlFor={htmlFor}
    className={cn("block text-sm font-medium text-gray-700 dark:text-gray-300", className)}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const FormError: React.FC<React.ComponentProps<"p">> = ({ children, className = "", ...props }) => (
  <p
    className={cn("text-sm text-red-600 dark:text-red-400", className)}
    {...props}
  >
    {children}
  </p>
);

const FormHelperText: React.FC<React.ComponentProps<"p">> = ({ children, className = "", ...props }) => (
  <p
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  >
    {children}
  </p>
);

const FormActions: React.FC<React.ComponentProps<"div">> = ({ children, className = "", ...props }) => (
  <div className={cn("flex justify-end space-x-3", className)} {...props}>
    {children}
  </div>
);

Form.Group = FormGroup;
Form.Label = FormLabel;
Form.Error = FormError;
Form.HelperText = FormHelperText;
Form.Actions = FormActions;

export default Form;
export { FormGroup, FormLabel, FormError, FormHelperText, FormActions };

