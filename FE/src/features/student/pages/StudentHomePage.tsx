import { MessageSquare, History, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useAuthStore } from "@/features/auth/store";

export default function StudentHomePage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Student Portal</p>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.fullName}</h1>
        <p className="mt-2 text-muted-foreground">
          Select a course from your assigned subjects below to view Q&A history or ask our AI assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/student/ask-ai")}
        >
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Ask AI</CardTitle>
            <CardDescription>Question answering by course</CardDescription>
          </CardHeader>
          <CardContent>

            <p className="text-sm font-medium text-primary">Click to open →</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/student/history")}
        >
          <CardHeader>
            <History className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>History</CardTitle>
            <CardDescription>Review past Q&A sessions</CardDescription>
          </CardHeader>
          <CardContent>

            <p className="text-sm font-medium text-primary">View logs &rarr;</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/50"
          onClick={() => navigate("/student/quiz")}
        >
          <CardHeader>
            <ClipboardList className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Practice Quiz</CardTitle>
            <CardDescription>AI-generated practice questions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-primary">Take Quiz &rarr;</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
