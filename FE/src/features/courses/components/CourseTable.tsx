import { Pencil, Trash2, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/StatusStates";
import type { Course } from "../types";

interface CourseTableProps {
  courses: Course[];
  isLoading?: boolean;
  userRole: "ADMIN" | "TEACHER" | "STUDENT";
  onEdit: (course: Course) => void;
  onToggleStatus: (course: Course) => void;
  onAssignStudents?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  isStatusUpdating?: boolean;
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CourseTable({
  courses,
  isLoading,
  userRole,
  onEdit,
  onToggleStatus,
  onAssignStudents,
  onDelete,
  isStatusUpdating,
}: CourseTableProps) {
  const isAdmin = userRole === "ADMIN";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <TableSkeleton />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses found"
        description="Try adjusting your filters, or create a new course."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Course Code</th>
              <th className="px-4 py-3">Course Name</th>
              <th className="px-4 py-3">Teacher in Charge</th>
              <th className="px-4 py-3">Students Enrolled</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {courses.map((course) => {
              const enrolledCount = course.enrollmentCount ?? 0;
              const hasEnrollments = enrolledCount > 0;

              return (
                <tr
                  key={course.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {course.courseCode}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{course.courseName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                      {course.description || "No description provided."}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-foreground/90 font-medium">
                    {course.teacherName}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{enrolledCount} student(s)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {course.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && onAssignStudents && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-primary hover:text-primary hover:bg-primary/5"
                          onClick={() => onAssignStudents(course)}
                        >
                          <Users className="h-4 w-4" aria-hidden />
                          Enroll
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => onEdit(course)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 min-w-[100px]"
                        disabled={isStatusUpdating}
                        onClick={() => onToggleStatus(course)}
                      >
                        {course.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>

                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/5 disabled:opacity-40 disabled:hover:bg-transparent"
                          disabled={hasEnrollments}
                          title={
                            hasEnrollments
                              ? "Cannot delete courses with enrolled students. Deactivate instead."
                              : "Permanently delete course"
                          }
                          onClick={() => onDelete(course)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
