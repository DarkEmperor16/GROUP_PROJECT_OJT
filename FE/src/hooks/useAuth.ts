import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginRequest } from "@/types/auth";
import { ROLE_HOME_PATH } from "@/types/auth";

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? null;

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      toast.success("Login successful", {
        description: `Welcome back, ${data.user.fullName}.`,
      });

      const homePath = from ?? ROLE_HOME_PATH[data.user.role];
      navigate(homePath, { replace: true });
    },
    onError: () => {
      toast.error("Login failed", {
        description: "Invalid credentials or server unavailable.",
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
        await authApi.logout();
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
