import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8 py-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          AI Learning Support System
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Ask course-related questions, review learning history, and practice
          quizzes based on official aviation academy documents.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>AI Q&A</CardTitle>
            <CardDescription>
              Get answers grounded in official course materials with source
              references.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Practice Quiz</CardTitle>
            <CardDescription>
              Auto-generated quizzes from course documents to reinforce learning.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>Learning History</CardTitle>
            <CardDescription>
              Review past questions, answers, and feedback in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in with your assigned account to start.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
