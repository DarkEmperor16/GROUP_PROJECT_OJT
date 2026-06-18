import { Link } from "react-router-dom";
import {
  BookOpen,
  MessageSquare,
  Plane,
  Sparkles,
  ArrowRight,
} from "lucide-react";
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
  },
  {
    icon: BookOpen,
    title: "Practice Quiz",
    description:
      "Auto-generated quizzes from course documents to reinforce learning.",
    accent: "from-secondary/25 to-secondary/5",
  },
  {
    icon: Sparkles,
    title: "Learning History",
    description:
      "Review past questions, answers, and feedback in one place.",
    accent: "from-primary/15 to-muted",
  },
] as const;

export default function HomePage() {
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
            <Link
              to="/login"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Explore platform
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-primary">Platform features</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Everything you need to learn aviation smarter
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, accent }) => (
            <Card
              key={title}
              className="border-border/60 bg-card/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft"
            >
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
              {title === "Learning History" && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sign in with your assigned account to start.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
