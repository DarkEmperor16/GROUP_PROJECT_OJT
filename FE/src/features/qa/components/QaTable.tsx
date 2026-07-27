import { Eye } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/StatusStates";
import UserRoleBadge from "@/features/users/components/UserRoleBadge";
import type { QaLog } from "../types";

interface QaTableProps {
  logs: QaLog[];
  isLoading?: boolean;
  onViewDetails: (log: QaLog) => void;
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function QaTable({ logs, isLoading, onViewDetails }: QaTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <TableSkeleton />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No audit logs found"
        description="Try adjusting your search query, selecting different filters, or checking your custom date ranges."
      />
    );
  }

  const getStatusBadge = (status: QaLog["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50">
            Failed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 animate-pulse">
            Processing
          </span>
        );
      default:
        return null;
    }
  };

  const truncateText = (text: string, maxLen = 60) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "...";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User Account</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Course Module</th>
              <th className="px-4 py-3">Question Snippet</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{log.userName}</p>
                  <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <UserRoleBadge role={log.userRole} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground/80">{log.courseCode}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">{log.courseName}</p>
                </td>
                <td className="px-4 py-3 text-foreground/80 max-w-xs truncate">
                  {truncateText(log.question)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(log.status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-lg text-primary hover:bg-primary/5"
                    onClick={() => onViewDetails(log)}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
