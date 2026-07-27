import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import UserFiltersBar from "@/features/users/components/UserFiltersBar";
import UserFormDialog from "@/features/users/components/UserFormDialog";
import UserTable from "@/features/users/components/UserTable";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/features/users/hooks/useUsers";
import type { CreateUserSchemaType, UpdateUserSchemaType } from "@/features/users/schema";
import type { ManagedUser, UserListParams } from "@/features/users/types";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  const usersQuery = useUsersQuery(filters);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const statusMutation = useUpdateUserStatusMutation();

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

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

  const handleCreate = (data: CreateUserSchemaType) => {
    createMutation.mutate(data, {
      onSuccess: () => closeDialog(),
    });
  };

  const handleUpdate = (data: UpdateUserSchemaType) => {
    if (!selectedUser) return;

    updateMutation.mutate(
      { id: selectedUser.id, payload: data },
      { onSuccess: () => closeDialog() },
    );
  };

  const handleToggleStatus = (user: ManagedUser) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: user.id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            User & Role Management
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Create and update accounts, assign roles, and control access with
            active or inactive status.
          </p>
        </div>
        <Button size="lg" className="gap-2 shrink-0" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden />
          Create user
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              Total users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Matching current filters
            </p>
          </CardContent>
        </Card>
      </div>

      <UserFiltersBar filters={filters} onChange={setFilters} />

      {usersQuery.isError ? (
        <ErrorState
          message="Could not load users. Please try again."
          onRetry={() => usersQuery.refetch()}
        />
      ) : (
        <UserTable
          users={users}
          isLoading={usersQuery.isLoading}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleStatus}
          isStatusUpdating={statusMutation.isPending}
        />
      )}

      {meta && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} users)
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
              Previous
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
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <UserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
