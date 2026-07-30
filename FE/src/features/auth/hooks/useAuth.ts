import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services";
import { useAuthStore } from "@/features/auth/store";
import type { LoginRequest } from "@/features/auth/types";
import { ROLE_HOME_PATH } from "@/features/auth/types";
import { syncAuthSession } from "@/features/auth/utils/syncSession";
import { QUERY_KEYS } from "@/shared/constants";

function useAuthRedirectPath() {
  const location = useLocation();
  return (
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? null
  );
}

/** Server state — session user từ /auth/me (kat-minh bài 7). */
export function useMeQuery() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: QUERY_KEYS.AUTH,
    queryFn: authService.getMe,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: false,
  });
}

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const from = useAuthRedirectPath();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      syncAuthSession(queryClient, data);
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.fullName}.`,
      });

      const homePath = from ?? ROLE_HOME_PATH[data.user.role];
      navigate(homePath, { replace: true });
    },
  });
};

export const useLogoutMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
      } catch {
        // Client logout even if API fails
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries();
      navigate("/login", { replace: true });
      toast.info("Logged out");
    },
  });
};
