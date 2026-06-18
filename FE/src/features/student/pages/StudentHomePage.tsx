import { MessageSquare, History, ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";

export default function StudentHomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.fullName}</h1>
        <p className="mt-2 text-muted-foreground">
          Select a course and start asking AI-powered questions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Ask AI</CardTitle>
            <CardDescription>Question answering by course</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon — SE-F4</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <History className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>History</CardTitle>
            <CardDescription>Review past Q&A sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon — SE-F5</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <ClipboardList className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Practice Quiz</CardTitle>
            <CardDescription>AI-generated practice questions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon — SE-F6</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
