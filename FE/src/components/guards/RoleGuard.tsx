import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types/auth";
import { ROLE_HOME_PATH } from "@/types/auth";

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <Outlet />;
}
