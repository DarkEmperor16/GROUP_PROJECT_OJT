import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userQueryKeys, userService } from "@/features/users/services";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserListParams,
  UserStatus,
} from "@/features/users/types";

export function useUsersQuery(params: UserListParams) {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => userService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("User created", {
        description: `${user.fullName} can sign in when status is Active.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to create user", {
        description: error.message || "Please check the form and try again.",
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
      toast.success("User updated", {
        description: `${user.fullName} has been saved.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update user", {
        description: error.message || "Please check the form and try again.",
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
        user.status === "ACTIVE" ? "User activated" : "User deactivated",
        {
          description:
            user.status === "ACTIVE"
              ? `${user.fullName} can sign in again.`
              : `${user.fullName} cannot sign in while inactive.`,
        },
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", {
        description: error.message || "Please try again.",
      });
    },
  });
}
