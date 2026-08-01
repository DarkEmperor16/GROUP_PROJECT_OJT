import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  useAssignPermissionsMutation,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  usePermissionsQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from "@/features/users/hooks/useUsers";
import type { SystemPermission, SystemRole } from "@/features/users/types";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";

// ─── Permission Checkbox Grid ─────────────────────────────────────────────────

function PermissionGrid({
  permissions,
  selected,
  onChange,
  disabled,
}: {
  permissions: SystemPermission[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  // Group by module
  const grouped = permissions.reduce<Record<string, SystemPermission[]>>(
    (acc, p) => {
      const mod = p.module ?? "General";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    },
    {},
  );

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {module}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {perms.map((p) => {
              const checked = selected.includes(p._id);
              return (
                <label
                  key={p._id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(p._id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Role Form Dialog ─────────────────────────────────────────────────────────

function RoleFormDialog({
  open,
  mode,
  role,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  role?: SystemRole | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");

  // Sync when role changes
  useState(() => {
    if (open) {
      setName(role?.name ?? "");
      setDescription(role?.description ?? "");
    }
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-xl font-bold">
              {mode === "create" ? "Tạo vai trò mới" : "Chỉnh sửa vai trò"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "create"
                ? "Tạo vai trò tùy chỉnh với các quyền riêng."
                : "Cập nhật thông tin vai trò."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tên vai trò <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ví dụ: CONTENT_MANAGER"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Mô tả
            </label>
            <Input
              placeholder="Mô tả ngắn về vai trò này"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !name.trim()}>
              {mode === "create" ? "Tạo vai trò" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  permissions,
  onEdit,
  onDelete,
}: {
  role: SystemRole;
  permissions: SystemPermission[];
  onEdit: (role: SystemRole) => void;
  onDelete: (role: SystemRole) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingPerms, setEditingPerms] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const assignMutation = useAssignPermissionsMutation();

  const currentPermIds = (role.permissions as any[]).map((p) =>
    typeof p === "string" ? p : p._id,
  );

  const handleEditPerms = () => {
    setSelectedPerms(currentPermIds);
    setEditingPerms(true);
    setExpanded(true);
  };

  const handleSavePerms = () => {
    assignMutation.mutate(
      { roleId: role._id, permissions: selectedPerms },
      { onSuccess: () => setEditingPerms(false) },
    );
  };

  const PROTECTED_ROLES = ["ADMIN", "STUDENT", "TEACHER"];
  const isProtected = PROTECTED_ROLES.includes(role.name);

  return (
    <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-mono text-base">{role.name}</CardTitle>
              {role.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {role.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {currentPermIds.length} quyền
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => onEdit(role)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Sửa
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary"
              onClick={handleEditPerms}
            >
              <Shield className="h-3.5 w-3.5" />
              Quyền
            </Button>

            {!isProtected && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-destructive">Chắc chắn?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { onDelete(role); setConfirmDelete(false); }}
                  >
                    Xóa
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Hủy
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="border-t border-border/40 pt-4">
          {editingPerms ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Chỉnh sửa quyền cho <span className="font-mono">{role.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPerms(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePerms}
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending ? "Đang lưu..." : "Lưu quyền"}
                  </Button>
                </div>
              </div>

              <PermissionGrid
                permissions={permissions}
                selected={selectedPerms}
                onChange={setSelectedPerms}
                disabled={assignMutation.isPending}
              />
            </div>
          ) : (
            <div>
              {currentPermIds.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có quyền nào được gán.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(role.permissions as any[]).map((p) => {
                    const perm = typeof p === "string"
                      ? permissions.find((x) => x._id === p)
                      : (p as SystemPermission);
                    if (!perm) return null;
                    return (
                      <span
                        key={perm._id}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {perm.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoleManagementPage() {
  const rolesQuery = useRolesQuery();
  const permissionsQuery = usePermissionsQuery();
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const deleteMutation = useDeleteRoleMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];

  const openCreate = () => {
    setFormMode("create");
    setSelectedRole(null);
    setFormOpen(true);
  };

  const openEdit = (role: SystemRole) => {
    setFormMode("edit");
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleSubmit = (data: { name: string; description: string }) => {
    if (formMode === "create") {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    } else if (selectedRole) {
      updateMutation.mutate(
        { id: selectedRole._id, payload: data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  };

  const handleDelete = (role: SystemRole) => {
    deleteMutation.mutate(role._id);
  };

  const isLoading = rolesQuery.isLoading || permissionsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Quản lý vai trò & quyền
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tạo vai trò tùy chỉnh, phân quyền chi tiết. Thay đổi quyền có hiệu lực ở lần đăng nhập tiếp theo.
          </p>
        </div>
        <Button size="lg" className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tạo vai trò
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              Tổng vai trò
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{roles.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Tổng quyền
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{permissions.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Quyền có thể gán</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Chưa có vai trò nào. Hãy tạo vai trò đầu tiên.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <RoleCard
              key={role._id}
              role={role}
              permissions={permissions}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <RoleFormDialog
        open={formOpen}
        mode={formMode}
        role={selectedRole}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
