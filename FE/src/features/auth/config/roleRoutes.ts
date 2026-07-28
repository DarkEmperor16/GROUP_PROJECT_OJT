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
 *
 * Teacher/Admin sub-routes: Long / Quốc Anh thêm vào đây khi có page.
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
          () => import("@/features/teacher"),
          "TeacherDashboardPage",
        ),
      },
      {
        path: "teacher/courses",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherSubjectManagementPage",
        ),
      },
      {
        path: "teacher/documents",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherDocumentManagingPage",
        ),
      },
      {
        path: "teacher/review",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherReviewPage",
        ),
      },
      {
        path: "teacher/quizzes",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherQuizCreationPage",
        ),
      },
      {
        path: "teacher/ai-chat",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherAIChatPage",
        ),
      },
      {
        path: "teacher/profile",
        lazy: lazyRoute(
          () => import("@/features/teacher"),
          "TeacherProfilePage",
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
      {
        path: "admin/users",
        lazy: lazyRoute(() => import("@/features/users"), "UserManagementPage"),
      },
      {
        path: "admin/courses",
        lazy: lazyRoute(() => import("@/features/courses"), "CourseManagementPage"),
      },
      {
        path: "admin/documents",
        lazy: lazyRoute(() => import("@/features/documents"), "AdminDocumentsPage"),
      },
      {
        path: "admin/qa",
        lazy: lazyRoute(() => import("@/features/qa"), "AdminQaHistoryPage"),
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
