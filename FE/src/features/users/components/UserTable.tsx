import { Pencil, UserCheck, UserX } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/StatusStates";
import UserRoleBadge from "@/features/users/components/UserRoleBadge";
import UserStatusBadge from "@/features/users/components/UserStatusBadge";
import type { ManagedUser } from "@/features/users/types";

interface UserTableProps {
  users: ManagedUser[];
  isLoading?: boolean;
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  isStatusUpdating?: boolean;
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onToggleStatus,
  isStatusUpdating,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <TableSkeleton />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="Try adjusting your search or filters, or create a new user."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">User code</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground/90">
                  {user.userCode}
                </td>
                <td className="px-4 py-3">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.updatedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onEdit(user)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={isStatusUpdating}
                      onClick={() => onToggleStatus(user)}
                    >
                      {user.status === "ACTIVE" ? (
                        <>
                          <UserX className="h-4 w-4" aria-hidden />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" aria-hidden />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
