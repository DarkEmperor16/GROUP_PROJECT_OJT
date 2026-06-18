import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import RequireAuth from "@/components/guards/RequireAuth";
import GuestGuard from "@/components/guards/GuestGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/features/auth/pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <GuestGuard />,
        children: [{ path: "login", element: <LoginPage /> }],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RoleGuard allowedRoles={["STUDENT"]} />,
            children: [
              {
                path: "student",
                lazy: async () => {
                  const { default: Component } = await import(
                    "@/features/student/pages/StudentHomePage"
                  );
                  return { Component };
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
                  const { default: Component } = await import(
                    "@/features/dashboard/pages/TeacherDashboardPage"
                  );
                  return { Component };
                },
              },
            ],
          },
          {
            element: <RoleGuard allowedRoles={["ADMIN", "SECURITY_ADMIN"]} />,
            children: [
              {
                path: "admin/dashboard",
                lazy: async () => {
                  const { default: Component } = await import(
                    "@/features/dashboard/pages/AdminDashboardPage"
                  );
                  return { Component };
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
