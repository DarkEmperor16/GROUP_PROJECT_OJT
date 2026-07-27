import { cn } from "@/lib/utils";
import type { UserStatus } from "@/features/users/types";

const statusStyles: Record<UserStatus, string> = {
  ACTIVE:
    "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  INACTIVE:
    "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export default function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
