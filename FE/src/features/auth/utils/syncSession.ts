import type { QueryClient } from "@tanstack/react-query";
import type { LoginResponse } from "@/features/auth/types";
import { useAuthStore } from "@/features/auth/store";
import { prefetchRoleRoutes } from "@/features/auth/utils/prefetchRoutes";
import { QUERY_KEYS } from "@/shared/constants";

/** Sync Zustand + React Query cache after login / 2FA. */
export function syncAuthSession(
  queryClient: QueryClient,
  data: LoginResponse,
  options?: { eagerPrefetch?: boolean },
) {
  useAuthStore
    .getState()
    .setAuth(data.accessToken, data.refreshToken, data.user);
  queryClient.setQueryData(QUERY_KEYS.AUTH, data.user);
  prefetchRoleRoutes(data.user.role, {
    eager: options?.eagerPrefetch ?? true,
  });
}
