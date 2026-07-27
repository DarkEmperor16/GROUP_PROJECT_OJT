import type { UserRole } from "@/features/auth/types";

export interface RoleNavItem {
  label: string;
  path: string;
  end?: boolean;
}

/**
 * Menu header — chỉ route đã có trong roleRoutes.ts.
 * Student paths: page của Vũ, Quang chỉ wire nav ở MainLayout.
 * Teacher/Admin: Long / Quốc Anh thêm item khi có page mới.
 */
export const ROLE_NAV_ITEMS: Record<UserRole, RoleNavItem[]> = {
  STUDENT: [
    { label: "Learning", path: "/student", end: true },
    { label: "Ask AI", path: "/student/ask-ai" },
    { label: "Quiz", path: "/student/quiz" },
    { label: "History", path: "/student/history" },
  ],
  TEACHER: [
    { label: "Dashboard", path: "/teacher/dashboard", end: true },
    { label: "Courses", path: "/teacher/courses" },
    { label: "Documents", path: "/teacher/documents" },
    { label: "Review", path: "/teacher/review" },
    { label: "Create Quiz", path: "/teacher/quizzes" },
    { label: "AI", path: "/teacher/ai-chat" },
    { label: "Profile", path: "/teacher/profile" },
  ],
  ADMIN: [{ label: "Admin", path: "/admin/dashboard", end: true }],
};
