import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-20",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function LoadingState() {
  return <PageLoader />;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="font-semibold text-destructive">Oops!</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
