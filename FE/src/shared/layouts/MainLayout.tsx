import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Plane } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PageLoader } from "@/shared/components/common/StatusStates";
import RouteErrorBoundary from "@/shared/components/common/RouteErrorBoundary";
import { useAuthStore } from "@/features/auth/store";
import { useLogoutMutation } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logoutMutation = useLogoutMutation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="login-mesh flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold text-foreground transition-colors hover:text-primary"
          >
            <Plane className="h-5 w-5 text-primary" aria-hidden />
            Aviation Academy AI
          </Link>

          <nav className="flex items-center gap-1">
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

            {accessToken && user?.role === "ADMIN" && (
              <NavLink to="/admin/dashboard" className={navLinkClass}>
                Admin
              </NavLink>
            )}

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
          <Suspense fallback={<PageLoader />}>
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
