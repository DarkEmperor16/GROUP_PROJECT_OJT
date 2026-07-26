import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import RequireAuth from "@/shared/components/common/RequireAuth";
import GuestGuard from "@/shared/components/common/GuestGuard";
import { buildProtectedRoleRoutes } from "@/features/auth/config/buildProtectedRoutes";
import { lazyRoute } from "@/lib/lazyRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <GuestGuard />,
    children: [
      {
        index: true,
        lazy: lazyRoute(() => import("@/features/auth"), "LoginPage"),
      },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        lazy: lazyRoute(() => import("@/features/landing"), "HomePage"),
      },
      {
        element: <RequireAuth />,
        children: buildProtectedRoleRoutes(),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
