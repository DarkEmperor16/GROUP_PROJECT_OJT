import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import RequireAuth from "@/shared/components/common/RequireAuth";
import GuestGuard from "@/shared/components/common/GuestGuard";
import RoleGuard from "@/shared/components/common/RoleGuard";
import { HomePage } from "@/features/landing";
import { LoginPage } from "@/features/auth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <GuestGuard />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RoleGuard allowedRoles={["STUDENT"]} />,
            children: [
              {
                path: "student",
                lazy: async () => {
                  const { StudentHomePage } = await import("@/features/student");
                  return { Component: StudentHomePage };
                },
              },

              {
                path: "student/ask-ai",
                lazy: async () => {

                  const { StudentAskAiPage } = await import("@/features/student");
                  return { Component: StudentAskAiPage };
                },
              },
              {
                path: "student/ask-ai/:subjectId",
                lazy: async () => {
                  const { StudentAiChatPage } = await import("@/features/student");
                  return { Component: StudentAiChatPage };
                },
              },
              {
                path: "student/history",
                lazy: async () => {
                  const { StudentHistoryPage } = await import("@/features/student");
                  return { Component: StudentHistoryPage };
                },
              },
              {
                path: "student/quiz",
                lazy: async () => {
                  const { StudentQuizListPage } = await import("@/features/student");
                  return { Component: StudentQuizListPage };
                },
              },
              {
                path: "student/quiz/:quizId",
                lazy: async () => {
                  const { StudentQuizWorkspacePage } = await import("@/features/student");
                  return { Component: StudentQuizWorkspacePage };
                },
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={["TEACHER"]} />,
            children: [
              {
                path: "teacher/dashboard",
                lazy: async () => {
                  const { TeacherDashboardPage } = await import(
                    "@/features/dashboard"
                  );
                  return { Component: TeacherDashboardPage };
                },
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={["ADMIN"]} />,
            children: [
              {
                path: "admin/dashboard",
                lazy: async () => {
                  const { AdminDashboardPage } = await import(
                    "@/features/dashboard"
                  );
                  return { Component: AdminDashboardPage };
                },
              },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
