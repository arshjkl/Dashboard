import type {
  ButtonHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
  };

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-bgmi-green text-black hover:bg-bgmi-greenDark",

    secondary:
      "border border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]",

    danger:
      "border border-bgmi-red/20 bg-bgmi-red/10 text-bgmi-red hover:bg-bgmi-red/20",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}