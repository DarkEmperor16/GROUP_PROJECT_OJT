import { lazyRoute } from "@/lib/lazyRoute";
import type { UserRole } from "@/features/auth/types";
import { ROLE_HOME_PATH } from "@/features/auth/types";

export interface RoleRouteDefinition {
  path: string;
  lazy: ReturnType<typeof lazyRoute>;
}

export interface RoleRouteGroup {
  role: UserRole;
  routes: RoleRouteDefinition[];
}

/**
 * Dynamic routing theo role — thêm route mới chỉ cần sửa config này.
 * Lazy import giữ bundle nhỏ (chỉ tải page khi user vào đúng role).
 */
export const ROLE_ROUTE_GROUPS: RoleRouteGroup[] = [
  {
    role: "STUDENT",
    routes: [
      {
        path: "student",
        lazy: lazyRoute(() => import("@/features/student"), "StudentHomePage"),
      },
      {
        path: "student/ask-ai",
        lazy: lazyRoute(() => import("@/features/student"), "StudentAskAiPage"),
      },
      {
        path: "student/ask-ai/:subjectId",
        lazy: lazyRoute(
          () => import("@/features/student"),
          "StudentAiChatPage",
        ),
      },
      {
        path: "student/history",
        lazy: lazyRoute(
          () => import("@/features/student"),
          "StudentHistoryPage",
        ),
      },
      {
        path: "student/quiz",
        lazy: lazyRoute(
          () => import("@/features/student"),
          "StudentQuizListPage",
        ),
      },
      {
        path: "student/quiz/:quizId",
        lazy: lazyRoute(
          () => import("@/features/student"),
          "StudentQuizWorkspacePage",
        ),
      },
    ],
  },
  {
    role: "TEACHER",
    routes: [
      {
        path: "teacher/dashboard",
        lazy: lazyRoute(
          () => import("@/features/dashboard"),
          "TeacherDashboardPage",
        ),
      },
    ],
  },
  {
    role: "ADMIN",
    routes: [
      {
        path: "admin/dashboard",
        lazy: lazyRoute(
          () => import("@/features/dashboard"),
          "AdminDashboardPage",
        ),
      },
    ],
  },
];

export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATH[role];
}

export function getRoutesForRole(role: UserRole): RoleRouteDefinition[] {
  return ROLE_ROUTE_GROUPS.find((group) => group.role === role)?.routes ?? [];
}
