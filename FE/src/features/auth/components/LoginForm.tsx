import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Plane } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/hooks/useAuth";
import { loginSchema, type LoginSchemaType } from "@/utils/rules";

export default function LoginForm() {
  const location = useLocation();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginSchemaType) => {
    loginMutation.mutate(data);
  };

  const redirectFrom = (
    location.state as { from?: { pathname: string } } | null
  )?.from?.pathname;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plane className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-3xl font-bold">Aviation Academy</CardTitle>
          <CardDescription>
            Sign in with your assigned account to continue learning
          </CardDescription>
        </CardHeader>

        <CardContent>
          {redirectFrom && (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Please sign in to access {redirectFrom}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" aria-hidden />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student@academy.edu"
                hasError={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" aria-hidden />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                hasError={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are provisioned by administrators. No public registration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
