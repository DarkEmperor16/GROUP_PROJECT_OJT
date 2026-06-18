import { BarChart3, FileText, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor student questions and AI answer quality.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Students</CardTitle>
            <CardDescription>AI usage by course</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Top Questions</CardTitle>
            <CardDescription>Most asked topics</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Documents</CardTitle>
            <CardDescription>Manage course materials</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
