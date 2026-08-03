import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import UserFiltersBar from "@/features/users/components/UserFiltersBar";
import UserFormDialog from "@/features/users/components/UserFormDialog";
import UserTable from "@/features/users/components/UserTable";
import ResetPasswordDialog from "@/features/users/components/ResetPasswordDialog";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useLockUserMutation,
  useResetPasswordMutation,
  useRestoreUserMutation,
  useUnlockUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/hooks/useUsers";
import type { CreateUserSchemaType, UpdateUserSchemaType } from "@/features/users/schema";
import type {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserListParams,
} from "@/features/users/types";
import { ErrorState } from "@/shared/components/common/StatusStates";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const DEFAULT_FILTERS: UserListParams = {
  search: "",
  role: "",
  status: "",
  page: 1,
  limit: 10,
};

export default function UserManagementPage() {
  const [filters, setFilters] = useState<UserListParams>(DEFAULT_FILTERS);

  // Form dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Reset password dialog
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<ManagedUser | null>(null);

  // Queries & Mutations
  const usersQuery = useUsersQuery(filters);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const lockMutation = useLockUserMutation();
  const unlockMutation = useUnlockUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const restoreMutation = useRestoreUserMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  // ─── Dialog handlers ────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: ManagedUser) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const openResetPasswordDialog = (user: ManagedUser) => {
    setResetPwdUser(user);
    setResetPwdOpen(true);
  };

  const closeResetPasswordDialog = () => {
    setResetPwdOpen(false);
    setResetPwdUser(null);
  };

  // ─── Mutation handlers ───────────────────────────────────────────────────────

  const handleCreate = (data: CreateUserSchemaType) => {
    const payload: CreateUserPayload = {
      fullName: data.fullName,
      email: data.email,
      userCode: data.userCode,
      password: data.password,
      role: data.role,
      status: data.status,
    };

    createMutation.mutate(payload, {
      onSuccess: () => closeDialog(),
    });
  };

  const handleUpdate = (data: UpdateUserSchemaType) => {
    if (!selectedUser) return;

    const payload: UpdateUserPayload = {
      fullName: data.fullName,
      email: data.email,
      userCode: data.userCode,
      role: data.role,
      status: data.status,
    };

    updateMutation.mutate(
      { id: selectedUser.id, payload },
      { onSuccess: () => closeDialog() },
    );
  };

  const handleLock = (user: ManagedUser) => {
    lockMutation.mutate(user.id);
  };

  const handleUnlock = (user: ManagedUser) => {
    unlockMutation.mutate(user.id);
  };

  const handleDelete = (user: ManagedUser) => {
    deleteMutation.mutate(user.id);
  };

  const handleRestore = (user: ManagedUser) => {
    restoreMutation.mutate(user.id);
  };

  const handleResetPassword = (id: string, password: string) => {
    resetPasswordMutation.mutate(
      { id, password },
      { onSuccess: () => closeResetPasswordDialog() },
    );
  };

  // ─── Derived stats ────────────────────────────────────────────────────────

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const lockedCount = users.filter((u) => u.isLocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tạo tài khoản, phân vai trò, khóa/mở khóa và kiểm soát quyền truy cập.
          </p>
        </div>
        <Button size="lg" className="gap-2 shrink-0" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden />
          Tạo tài khoản
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              Tổng người dùng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Khớp với bộ lọc hiện tại
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-emerald-600">
              <Users className="h-5 w-5" aria-hidden />
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Có thể đăng nhập
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
              <Users className="h-5 w-5" aria-hidden />
              Đang bị khóa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{lockedCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bị khóa bởi admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <UserFiltersBar filters={filters} onChange={setFilters} />

      {/* Table */}
      {usersQuery.isError ? (
        <ErrorState
          message="Không thể tải danh sách người dùng. Vui lòng thử lại."
          onRetry={() => usersQuery.refetch()}
        />
      ) : (
        <UserTable
          users={users}
          isLoading={usersQuery.isLoading}
          onEdit={openEditDialog}
          onToggleStatus={() => {}}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onResetPassword={openResetPasswordDialog}
          isLockUpdating={lockMutation.isPending || unlockMutation.isPending}
        />
      )}

      {/* Pagination */}
      {meta && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} ({total} người dùng)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1 || usersQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
              }
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages || usersQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
              }
            >
              Sau
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <UserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ResetPasswordDialog
        open={resetPwdOpen}
        user={resetPwdUser}
        isSubmitting={resetPasswordMutation.isPending}
        onClose={closeResetPasswordDialog}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
