import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userQueryKeys, userService } from "@/features/users/services";
import type {
  CreateUserPayload,
  SystemRole,
  UpdateUserPayload,
  UserListParams,
  UserStatus,
} from "@/features/users/types";

// ─── User Queries ────────────────────────────────────────────────────────────

export function useUsersQuery(params: UserListParams) {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => userService.list(params),
    placeholderData: (previous) => previous,
  });
}

// ─── User Mutations ───────────────────────────────────────────────────────────

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Tạo tài khoản thành công", {
        description: `${user.fullName} đã được tạo.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Tạo tài khoản thất bại", {
        description: error.message || "Vui lòng kiểm tra lại thông tin.",
      });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserPayload;
    }) => userService.update(id, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Cập nhật thành công", {
        description: `Thông tin của ${user.fullName} đã được lưu.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Cập nhật thất bại", {
        description: error.message || "Vui lòng kiểm tra lại thông tin.",
      });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.updateStatus(id, status),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success(
        user.status === "ACTIVE" ? "Kích hoạt tài khoản" : "Vô hiệu hóa tài khoản",
        {
          description:
            user.status === "ACTIVE"
              ? `${user.fullName} có thể đăng nhập trở lại.`
              : `${user.fullName} không thể đăng nhập.`,
        },
      );
    },
    onError: (error: Error) => {
      toast.error("Cập nhật trạng thái thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useLockUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.lock(id),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Khóa tài khoản thành công", {
        description: `${user.fullName} đã bị khóa và không thể đăng nhập.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Khóa tài khoản thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.unlock(id),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Mở khóa tài khoản thành công", {
        description: `${user.fullName} có thể đăng nhập trở lại.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Mở khóa tài khoản thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Xóa tài khoản thành công", {
        description: `${user.fullName} đã bị xóa (soft delete).`,
      });
    },
    onError: (error: Error) => {
      toast.error("Xóa tài khoản thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useRestoreUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.restore(id),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Khôi phục tài khoản thành công", {
        description: `${user.fullName} đã được khôi phục.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Khôi phục tài khoản thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useResetPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      userService.resetPassword(id, password),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Đặt lại mật khẩu thành công", {
        description: `Mật khẩu của ${user.fullName} đã được cập nhật.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Đặt lại mật khẩu thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

export function useAssignRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userService.assignRole(id, role),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("Gán vai trò thành công", {
        description: `Vai trò của ${user.fullName} đã được cập nhật.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Gán vai trò thất bại", {
        description: error.message || "Vui lòng thử lại.",
      });
    },
  });
}

// ─── Role & Permission Queries ────────────────────────────────────────────────

export const roleQueryKeys = {
  all: ["roles"] as const,
  list: () => ["roles", "list"] as const,
  detail: (id: string) => ["roles", id] as const,
  permissions: () => ["permissions", "list"] as const,
};

export function useRolesQuery() {
  return useQuery({
    queryKey: roleQueryKeys.list(),
    queryFn: async () => {
      const res = await userService.listRoles() as any;
      return (res?.data ?? res?.roles ?? res ?? []) as SystemRole[];
    },
  });
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: roleQueryKeys.permissions(),
    queryFn: async () => {
      const res = await userService.listPermissions() as any;
      return (res?.data ?? res?.permissions ?? res ?? []) as import("@/features/users/types").SystemPermission[];
    },
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string; permissions?: string[] }) =>
      userService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all });
      toast.success("Tạo vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error("Tạo vai trò thất bại", { description: error.message });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; description?: string } }) =>
      userService.updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all });
      toast.success("Cập nhật vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error("Cập nhật vai trò thất bại", { description: error.message });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all });
      toast.success("Xóa vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error("Xóa vai trò thất bại", { description: error.message });
    },
  });
}

export function useAssignPermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      userService.assignPermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all });
      toast.success("Cập nhật quyền thành công", {
        description: "Thay đổi sẽ có hiệu lực ở lần đăng nhập tiếp theo.",
      });
    },
    onError: (error: Error) => {
      toast.error("Cập nhật quyền thất bại", { description: error.message });
    },
  });
}
