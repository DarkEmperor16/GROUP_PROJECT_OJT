import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive";
}

const variants = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  outline:
    "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function Button({
  className,
  children,
  isLoading,
  disabled,
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
