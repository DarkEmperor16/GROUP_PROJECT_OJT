import { Link } from "react-router-dom";
import { BarChart3, FileText, Users, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-sans">Teacher Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor student questions and AI answer quality.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
          <CardHeader>
            <Users className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Students</CardTitle>
            <CardDescription>AI usage by course</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Top Questions</CardTitle>
            <CardDescription>Most asked topics</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Course Documents</CardTitle>
            <CardDescription>Manage course materials & configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/teacher/courses"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              Manage courses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
