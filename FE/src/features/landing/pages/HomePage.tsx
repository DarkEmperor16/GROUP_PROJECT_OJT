import { Link } from "react-router-dom";
import {
  BookOpen,
  MessageSquare,
  Plane,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { ROLE_HOME_PATH } from "@/features/auth/types";
import { buttonVariants } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: MessageSquare,
    title: "AI Q&A",
    description:
      "Get answers grounded in official course materials with source references.",
    accent: "from-primary/20 to-primary/5",
    studentPath: "/student/ask-ai",
  },
  {
    icon: BookOpen,
    title: "Practice Quiz",
    description:
      "Auto-generated quizzes from course documents to reinforce learning.",
    accent: "from-secondary/25 to-secondary/5",
    studentPath: "/student/quiz",
  },
  {
    icon: Sparkles,
    title: "Learning History",
    description:
      "Review past questions, answers, and feedback in one place.",
    accent: "from-primary/15 to-muted",
    studentPath: "/student/history",
  },
] as const;

const ROLE_CTA: Record<
  keyof typeof ROLE_HOME_PATH,
  { label: string; explore: string }
> = {
  STUDENT: { label: "Go to Learning", explore: "Open student workspace" },
  TEACHER: { label: "Go to Dashboard", explore: "Open teacher dashboard" },
  ADMIN: { label: "Go to Admin", explore: "Open admin panel" },
};

export default function HomePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = Boolean(accessToken && user);
  const workspacePath = user ? ROLE_HOME_PATH[user.role] : "/login";
  const cta = user ? ROLE_CTA[user.role] : null;

  const featureLink = (studentPath: string) => {
    if (!isLoggedIn) return "/login";
    if (user?.role === "STUDENT") return studentPath;
    return ROLE_HOME_PATH[user!.role];
  };

  const featureActionLabel = () => {
    if (!isLoggedIn) return "Sign in to open";
    if (user?.role === "STUDENT") return "Open";
    return "Go to your workspace";
  };

  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <section className="login-mesh relative overflow-hidden border-b border-border/60 px-4 py-14 md:px-6 md:py-20">
        <div
          className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-secondary/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Plane className="h-4 w-4" aria-hidden />
            Aviation Academy AI
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            AI Learning Support System
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Ask course-related questions, review learning history, and practice
            quizzes based on official aviation academy documents.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn && cta ? (
              <>
                <Link
                  to={workspacePath}
                  className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                >
                  {cta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#features"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                  )}
                >
                  {cta.explore}
                </a>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(buttonVariants({ size: "lg" }), "gap-2")}
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#features"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                  )}
                >
                  Explore platform
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-primary">Platform features</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Everything you need to learn aviation smarter
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, accent, studentPath }) => {
            const to = featureLink(studentPath);
            const actionLabel = featureActionLabel();

            return (
              <Link
                key={title}
                to={to}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <Card className="h-full border-border/60 bg-card/90 backdrop-blur-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-soft">
                  <CardHeader>
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-primary",
                        accent,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      {actionLabel}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
