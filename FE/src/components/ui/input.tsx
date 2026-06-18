import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        hasError ? "border-destructive" : "border-input",
        className,
      )}
      {...props}
    />
  );
}
