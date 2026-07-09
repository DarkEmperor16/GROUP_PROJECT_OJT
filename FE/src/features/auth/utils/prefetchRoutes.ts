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

/** Preload JS chunk for the user's role — reduces delay on first navigation. */
export function prefetchRoleRoutes(role: UserRole) {
  const load = ROLE_MODULE_LOADERS[role];
  if (!load) return;
  scheduleIdle(() => {
    void load();
  });
}

export function prefetchLoginPage() {
  scheduleIdle(() => {
    void import("@/features/auth");
  });
}

export function prefetchHomePage() {
  scheduleIdle(() => {
    void import("@/features/landing");
  });
}
