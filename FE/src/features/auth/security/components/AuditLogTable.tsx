import { EmptyState } from "@/shared/components/common/StatusStates";
import type { AuditLogEntry } from "@/features/auth/security/types";
import { cn } from "@/lib/utils";

interface AuditLogTableProps {
  items: AuditLogEntry[];
  isLoading?: boolean;
  className?: string;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * Bảng audit log (read-only) — Admin/Security dùng khi BE có API.
 * Quốc Anh có thể nhúng vào Admin dashboard sau.
 */
export default function AuditLogTable({
  items,
  isLoading,
  className,
}: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-muted/60"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No audit logs"
        description="Logs will appear when the backend API is connected."
      />
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/60", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Result</th>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => (
            <tr
              key={log.id}
              className="border-b border-border/40 last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {formatTime(log.timestamp)}
              </td>
              <td className="px-4 py-3 font-medium">{log.action}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    log.result === "SUCCESS"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800",
                  )}
                >
                  {log.result}
                </span>
              </td>
              <td className="px-4 py-3">
                {log.email ?? log.userId ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {log.ipAddress ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
