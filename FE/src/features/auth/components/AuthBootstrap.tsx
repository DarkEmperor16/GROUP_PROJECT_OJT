import { useEffect, type ReactNode } from "react";
import { authService } from "@/features/auth/services";
import { useAuthStore } from "@/features/auth/store";
import { prefetchRoleRoutes } from "@/features/auth/utils/prefetchRoutes";

/**
 * Validate session in the background — do not block first paint.
 * Uses cached auth from localStorage while /me refreshes user data.
 */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    authService
      .getMe()
      .then((freshUser) => {
        if (!cancelled) {
          setAuth(accessToken, refreshToken ?? "", freshUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuth();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, setAuth, clearAuth]);

  useEffect(() => {
    if (user?.role) {
      prefetchRoleRoutes(user.role);
    }
  }, [user?.role]);

  return children;
}
