import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import RoleSelector from "@/features/auth/components/RoleSelector";
import { useLoginMutation } from "@/features/auth/hooks/useAuth";
import { loginSchema, type LoginSchemaType } from "@/features/auth/schema";

const highlights = [
  {
    icon: Brain,
    title: "RAG-powered Q&A",
    text: "Answers cited from verified aviation course materials.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-ready",
    text: "Secure access with role-based learning paths.",
  },
] as const;

function BrandPanel() {
  return (
    <aside className="brand-panel relative hidden w-[48%] flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-secondary/30 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 motion-safe:animate-fade-up">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
            <Plane className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">OJT KNS SU26</p>
            <h1 className="text-xl font-semibold tracking-tight">
              Aviation Academy AI
            </h1>
          </div>
        </div>

        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Learn smarter with an AI assistant built for aviation training.
          </h2>
          <p className="text-base leading-relaxed text-white/75">
            Query technical manuals, review procedures, and practice with
            intelligent quizzes — all grounded in official academy documents.
          </p>
        </div>
      </div>

      <div className="relative z-10 space-y-4 motion-safe:animate-fade-up [animation-delay:120ms]">
        {highlights.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="glass-card flex gap-4 rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{text}</p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4 text-secondary" aria-hidden />
          <span>Trusted by instructors and student pilots</span>
        </div>
      </div>
    </aside>
  );
}

export default function LoginForm() {
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "STUDENT",
    },
  });

  const redirectFrom = (
    location.state as { from?: { pathname: string } } | null
  )?.from?.pathname;

  return (
    <div className="login-mesh relative flex min-h-dvh">
      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/90 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-primary sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to home
      </Link>

      <BrandPanel />

      <main className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-[440px] motion-safe:animate-fade-up">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
              <Plane className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Aviation Academy AI
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to continue your learning journey
            </p>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm font-medium text-primary">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Use the credentials provided by your administrator.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur-sm sm:p-8">
            {redirectFrom && (
              <Alert className="mb-6 border-amber-200/80 bg-amber-50 text-amber-900">
                <AlertDescription>
                  Please sign in to access{" "}
                  <span className="font-medium">{redirectFrom}</span>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Sign in as
                      </FormLabel>
                      <FormControl>
                        <RoleSelector
                          value={field.value}
                          onChange={field.onChange}
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Mail className="h-4 w-4" aria-hidden />
                          </div>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="student@academy.edu"
                            className="pl-14"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/90">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Lock className="h-4 w-4" aria-hidden />
                          </div>
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            className="pl-14 pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Accounts are provisioned by administrators only.
            <br />
            Contact your academy admin if you need access.
          </p>
        </div>
      </main>
    </div>
  );
}
