import { useEffect, useState } from "react";
import { AlertCircle, Clock, ShieldAlert } from "lucide-react";
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
  retryAfterSeconds,
  className,
}: AuthSecurityAlertProps) {
  const [timeLeft, setTimeLeft] = useState<number | undefined>(retryAfterSeconds);

  useEffect(() => {
    setTimeLeft(retryAfterSeconds);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (timeLeft === undefined || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${secs}s`;
  };

  const Icon = variant === "warning" ? ShieldAlert : AlertCircle;

  return (
    <Alert className={cn("mb-6", variantStyles[variant], className)}>
      <Icon className="h-4 w-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-1">
        <p>{description}</p>
        {timeLeft !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 font-mono text-xs font-semibold">
            <Clock className="h-3.5 w-3.5 text-destructive animate-pulse" />
            {timeLeft > 0 ? (
              <span>Time remaining until unlock: {formatTime(timeLeft)}</span>
            ) : (
              <span className="text-emerald-600 font-medium">
                Lockout expired. You can try signing in again.
              </span>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
