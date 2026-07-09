import { Suspense, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Plane } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PageSkeleton } from "@/shared/components/common/StatusStates";
import RouteErrorBoundary from "@/shared/components/common/RouteErrorBoundary";
import RoutePendingBar from "@/shared/components/common/RoutePendingBar";
import { ROLE_NAV_ITEMS } from "@/features/auth/config/roleNav";
import { useAuthStore } from "@/features/auth/store";
import { useLogoutMutation } from "@/features/auth/hooks/useAuth";
import { prefetchRoleRoutes, prefetchHomePage } from "@/features/auth/utils/prefetchRoutes";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    if (user?.role) {
      prefetchRoleRoutes(user.role, { eager: true });
    }
  }, [user?.role]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-[color,background-color] duration-100 touch-manipulation",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  const roleNav =
    accessToken && user?.role ? ROLE_NAV_ITEMS[user.role] : [];

  return (
    <div className="login-mesh flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <RoutePendingBar />

          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-foreground transition-colors duration-100 hover:text-primary touch-manipulation"
            onMouseEnter={() => prefetchHomePage()}
          >
            <Plane className="h-5 w-5 text-primary" aria-hidden />
            Aviation Academy AI
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>

            {roleNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={navLinkClass}
                onMouseEnter={() => {
                  if (user?.role) prefetchRoleRoutes(user.role, { eager: true });
                }}
              >
                {item.label}
              </NavLink>
            ))}

            {accessToken ? (
              <div className="ml-2 flex items-center gap-3 border-l border-border/60 pl-3">
                <span
                  className="hidden text-sm sm:inline"
                  title={`Signed in as ${user?.role ?? ""}`}
                >
                  <span className="font-medium text-foreground">
                    {user?.fullName}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {user?.role}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Logout
                </Button>
              </div>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
        <RouteErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>

      <footer className="border-t border-border/60 bg-background/70 py-6 text-center text-sm text-muted-foreground">
        <p>AI Course Knowledge Consultation — Aviation Academy</p>
      </footer>
    </div>
  );
}
