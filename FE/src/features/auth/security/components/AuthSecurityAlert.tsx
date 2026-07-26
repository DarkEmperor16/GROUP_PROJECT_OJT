import { AlertCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import type { AuthSecurityAlert } from "@/features/auth/security/types";
import { cn } from "@/lib/utils";

const variantStyles = {
  destructive: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-amber-300/80 bg-amber-50 text-amber-950",
  default: "border-border bg-muted/40",
} as const;

interface AuthSecurityAlertProps extends AuthSecurityAlert {
  className?: string;
}

export default function AuthSecurityAlert({
  variant,
  title,
  description,
  className,
}: AuthSecurityAlertProps) {
  const Icon = variant === "warning" ? ShieldAlert : AlertCircle;

  return (
    <Alert className={cn("mb-6", variantStyles[variant], className)}>
      <Icon className="h-4 w-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
