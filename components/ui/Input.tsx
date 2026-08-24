import type {
  InputHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type InputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  };

export function Input({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="label">
          {label}
        </label>
      )}

      <input
        className={cn(
          "input",
          error && "border-bgmi-red/60",
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-xs text-bgmi-red">
          {error}
        </p>
      )}
    </div>
  );
}