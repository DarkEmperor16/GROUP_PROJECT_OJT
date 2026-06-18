import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/features/auth/services";
import { useAuthStore } from "@/features/auth/store";
import type { LoginRequest } from "@/features/auth/types";
import { ROLE_HOME_PATH } from "@/features/auth/types";

export const useLoginMutation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? null;

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data, credentials) => {
      if (data.user.role !== credentials.role) {
        toast.error("Role mismatch", {
          description:
            "The selected role does not match your account. Please try again.",
        });
        return;
      }

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
