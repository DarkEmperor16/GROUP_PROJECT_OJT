import { useEffect, type ReactNode } from "react";
import { useMeQuery } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth/store";
import { prefetchRoleRoutes } from "@/features/auth/utils/prefetchRoutes";

/**
 * Validate session in the background — do not block first paint.
 * Uses cached auth from localStorage while React Query refetches /me.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: freshUser, isError } = useMeQuery();

  useEffect(() => {
    if (freshUser && accessToken) {
      setAuth(accessToken, refreshToken ?? "", freshUser);
    }
  }, [freshUser, accessToken, refreshToken, setAuth]);

  useEffect(() => {
    if (isError && accessToken) {
      clearAuth();
    }
  }, [isError, accessToken, clearAuth]);

  useEffect(() => {
    if (user?.role) {
      prefetchRoleRoutes(user.role);
    }
  }, [user?.role]);

  return children;
}
