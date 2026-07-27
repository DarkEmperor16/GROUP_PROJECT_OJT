import { Link } from "react-router-dom";
import { Users, BookOpen, FileText, MessageSquare, ArrowRight } from "lucide-react";
import { useUsersQuery } from "@/features/users/hooks/useUsers";
import { useCoursesQuery } from "@/features/courses/hooks/useCourses";
import { useDocumentsQuery } from "@/features/documents/hooks/useDocuments";
import { useQaHistoryQuery } from "@/features/qa/hooks/useQa";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function OverviewStatsWidget() {
  const usersQuery = useUsersQuery({ limit: 1 });
  const coursesQuery = useCoursesQuery({ limit: 1 });
  const documentsQuery = useDocumentsQuery({ limit: 1 });
  const qaQuery = useQaHistoryQuery({ limit: 1 });

  const usersTotal = usersQuery.data?.meta.total;
  const coursesTotal = coursesQuery.data?.meta.total;
  const documentsTotal = documentsQuery.data?.meta.total;
  const qaTotal = qaQuery.data?.meta.total;

  const stats = [
    {
      title: "Total Users",
      value: usersTotal,
      isLoading: usersQuery.isLoading,
      description: "Registered accounts in academy",
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200/50",
      link: "/admin/users",
      actionText: "Manage users",
    },
    {
      title: "Courses Configured",
      value: coursesTotal,
      isLoading: coursesQuery.isLoading,
      description: "Active/Inactive subject modules",
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200/50",
      link: "/admin/courses",
      actionText: "Manage courses",
    },
    {
      title: "Course Manuals",
      value: documentsTotal,
      isLoading: documentsQuery.isLoading,
      description: "Uploaded study materials",
      icon: FileText,
      color: "text-sky-600 bg-sky-50 border-sky-200/50",
      link: "/admin/documents",
      actionText: "Manage documents",
    },
    {
      title: "AI Q&A Inquiries",
      value: qaTotal,
      isLoading: qaQuery.isLoading,
      description: "Student prompts answered",
      icon: MessageSquare,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200/50",
      link: "/admin/qa",
      actionText: "View audit logs",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-border/60 bg-card/90 backdrop-blur-sm shadow-soft transition-all duration-200 hover:-translate-y-0.5"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-xl border text-sm", stat.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {stat.isLoading ? (
                    <Skeleton className="h-9 w-16 rounded-md" />
                  ) : (
                    stat.value ?? 0
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
                {stat.link && (
                  <div className="mt-4 pt-3 border-t border-border/40">
                    <Link
                      to={stat.link}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "w-full h-8 px-2 justify-between text-xs text-primary hover:bg-primary/5 rounded-lg"
                      )}
                    >
                      <span>{stat.actionText}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
