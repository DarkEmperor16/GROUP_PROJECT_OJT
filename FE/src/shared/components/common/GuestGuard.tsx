import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store";
import { ROLE_HOME_PATH } from "@/features/auth/types";

export default function GuestGuard() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (accessToken && user) {
    return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;
  }

  return <Outlet />;
}
