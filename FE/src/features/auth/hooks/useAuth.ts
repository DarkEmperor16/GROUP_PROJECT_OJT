import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services";
import { parseAuthSecurityError } from "@/features/auth/security";
import { useAuthStore } from "@/features/auth/store";
import type { LoginRequest } from "@/features/auth/types";
import { ROLE_HOME_PATH } from "@/features/auth/types";
import { prefetchRoleRoutes } from "@/features/auth/utils/prefetchRoutes";

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? null;

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      prefetchRoleRoutes(data.user.role, { eager: true });
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.fullName}.`,
      });

      const homePath = from ?? ROLE_HOME_PATH[data.user.role];
      navigate(homePath, { replace: true });
    },
    onError: (error: unknown) => {
      const parsed = parseAuthSecurityError(error);
      toast.error(parsed.title, {
        description: parsed.description,
      });
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
