import { useEffect, useState, type ReactNode } from "react";
import { authService } from "@/features/auth/services";
import { useAuthStore } from "@/features/auth/store";
import { PageLoader } from "@/shared/components/common/StatusStates";

/** Validate persisted session with BE on app load. */
export default function AuthBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [ready, setReady] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    authService
      .getMe()
      .then((user) => {
        if (!cancelled) {
          setAuth(accessToken, refreshToken ?? "", user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuth();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, setAuth, clearAuth]);

  if (!ready) {
    return <PageLoader />;
  }

  return children;
}
