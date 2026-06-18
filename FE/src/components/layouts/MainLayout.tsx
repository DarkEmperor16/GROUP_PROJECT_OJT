import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/StatusStates";
import RouteErrorBoundary from "@/components/errors/RouteErrorBoundary";
import { useAuthStore } from "@/stores/auth.store";
import { useLogoutMutation } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logoutMutation = useLogoutMutation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-foreground transition-colors hover:text-primary"
          >
            <Plane className="h-5 w-5" aria-hidden />
            OJT KNS SU26
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>

            {accessToken && user?.role === "STUDENT" && (
              <NavLink to="/student" className={navLinkClass}>
                Learning
              </NavLink>
            )}

            {accessToken && user?.role === "TEACHER" && (
              <NavLink to="/teacher/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}

            {accessToken &&
              (user?.role === "ADMIN" || user?.role === "SECURITY_ADMIN") && (
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  Admin
                </NavLink>
              )}

            {accessToken ? (
              <div className="ml-2 flex items-center gap-3 border-l border-border pl-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user?.fullName}
                </span>
                <Button
                  variant="outline"
                  isLoading={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  className="gap-1.5"
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

      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <RouteErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>

      <footer className="border-t border-border bg-muted/40 py-6 text-center text-sm text-muted-foreground">
        <p>AI Course Knowledge Consultation — Aviation Academy</p>
      </footer>
    </div>
  );
}
