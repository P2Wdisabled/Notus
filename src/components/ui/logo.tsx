"use client";

import * as React from "react";
import Image from "next/image";
import logoLight from "@/../public/logoLight.png";
import logoDark from "@/../public/logoDark.png";

export interface LogoProps {
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Logo component that automatically switches between light and dark
 * images based on the current color scheme. Uses Tailwind's dark: classes.
 */
const Logo: React.FC<LogoProps> = ({
  alt = "Notus",
  width = 200,
  height = 57,
  className = "",
  priority = false,
}) => {
  return (
    <div className={`relative inline-block ${className}`} style={{ lineHeight: 0 }}>
      {/* Light mode logo */}
      <Image
        src={logoDark}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block dark:hidden select-none"
      />

      {/* Dark mode logo */}
      <Image
        src={logoLight}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="hidden dark:block select-none"
      />
    </div>
  );
};

export default Logo;

