import { useState } from "react";
import {
  Lock,
  LockOpen,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
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
  onLock: (user: ManagedUser) => void;
  onUnlock: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onRestore?: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  isStatusUpdating?: boolean;
  isLockUpdating?: boolean;
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
  onLock,
  onUnlock,
  onDelete,
  onRestore,
  onResetPassword,
}: UserTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        title="Không tìm thấy người dùng"
        description="Thử điều chỉnh bộ lọc hoặc tạo tài khoản mới."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Mã số</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Khóa</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map((user) => {
              const isDeleted = user.status === "INACTIVE" && user.isLocked;
              const isConfirming = confirmDeleteId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-muted/20 ${isDeleted ? "opacity-60" : ""}`}
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
                  <td className="px-4 py-3">
                    {user.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                        <Lock className="h-3 w-3" />
                        Đã khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <LockOpen className="h-3 w-3" />
                        Mở
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onEdit(user)}
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Sửa
                      </Button>

                      {/* Reset Password */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-amber-600 hover:text-amber-700"
                        onClick={() => onResetPassword(user)}
                        title="Đặt lại mật khẩu"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Mật khẩu
                      </Button>

                      {/* Lock / Unlock */}
                      {user.isLocked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                          onClick={() => onUnlock(user)}
                          title="Mở khóa tài khoản"
                        >
                          <LockOpen className="h-3.5 w-3.5" aria-hidden />
                          Mở khóa
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-orange-500/40 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"
                          onClick={() => onLock(user)}
                          title="Khóa tài khoản"
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          Khóa
                        </Button>
                      )}

                      {/* Restore (nếu là INACTIVE) */}
                      {user.status === "INACTIVE" && onRestore && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-sky-500/40 text-sky-600 hover:bg-sky-500/10"
                          onClick={() => onRestore(user)}
                          title="Khôi phục tài khoản"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          Khôi phục
                        </Button>
                      )}

                      {/* Delete với confirm inline */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-destructive font-medium">Chắc chắn?</span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              onDelete(user);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Xóa
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setConfirmDeleteId(user.id)}
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Xóa
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
