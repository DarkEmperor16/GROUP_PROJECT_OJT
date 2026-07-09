import type { UserRole } from "@/features/auth/types";

const ROLE_MODULE_LOADERS: Record<UserRole, () => Promise<unknown>> = {
  STUDENT: () => import("@/features/student"),
  TEACHER: () => import("@/features/dashboard"),
  ADMIN: () => import("@/features/dashboard"),
};

function scheduleIdle(task: () => void) {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(task);
    return;
  }
  setTimeout(task, 0);
}

interface PrefetchOptions {
  /** Tải chunk ngay — dùng sau login / hover nav */
  eager?: boolean;
}

/** Preload JS chunk theo role — giảm delay lần đầu vào workspace. */
export function prefetchRoleRoutes(role: UserRole, options?: PrefetchOptions) {
  const load = ROLE_MODULE_LOADERS[role];
  if (!load) return;

  if (options?.eager) {
    void load();
    return;
  }

  scheduleIdle(() => {
    void load();
  });
}

export function prefetchLoginPage(options?: PrefetchOptions) {
  const load = () => import("@/features/auth");
  if (options?.eager) {
    void load();
    return;
  }
  scheduleIdle(() => void load());
}

export function prefetchHomePage(options?: PrefetchOptions) {
  const load = () => import("@/features/landing");
  if (options?.eager) {
    void load();
    return;
  }
  scheduleIdle(() => void load());
}
