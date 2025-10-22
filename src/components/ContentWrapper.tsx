import { ReactNode } from "react";

interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-3xl", 
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
};

export default function ContentWrapper({ 
  children, 
  className = "",
  maxWidth = "lg" 
}: ContentWrapperProps) {
  return (
    <div className="md:ml-64 md:min-h-screen md:pl-4 pt-6">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 md:px-6 lg:px-8 py-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}

