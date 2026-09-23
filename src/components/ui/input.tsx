import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={twMerge(
          clsx(
            "flex h-9 w-full rounded-md border border-[#27272A] bg-[#0E0E10] px-3 py-1 text-sm text-neutral-100 shadow-sm transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-neutral-500",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
