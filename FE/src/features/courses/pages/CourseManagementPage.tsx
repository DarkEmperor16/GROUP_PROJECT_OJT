import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, BookOpen } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import CourseFiltersBar from "../components/CourseFiltersBar";
import CourseFormDialog from "../components/CourseFormDialog";
import EnrollmentDialog from "../components/EnrollmentDialog";
import CourseTable from "../components/CourseTable";
import {
  useCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useUpdateCourseStatusMutation,
  useDeleteCourseMutation,
} from "../hooks/useCourses";
import type { CreateCourseSchemaType, UpdateCourseSchemaType } from "../schema";
import type { Course, CourseListParams } from "../types";
import { ErrorState } from "@/shared/components/common/StatusStates";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const DEFAULT_FILTERS: CourseListParams = {
  search: "",
  teacherId: "",
  status: "",
  page: 1,
  limit: 10,
};

export default function CourseManagementPage() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role ?? "STUDENT";
  
  const [filters, setFilters] = useState<CourseListParams>(DEFAULT_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const coursesQuery = useCoursesQuery(filters);
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation();
  const statusMutation = useUpdateCourseStatusMutation();
  const deleteMutation = useDeleteCourseMutation();

  const courses = coursesQuery.data?.data ?? [];
  const meta = coursesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setDialogMode("edit");
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedCourse(null);
  };

  const openEnrollDialog = (course: Course) => {
    setSelectedCourse(course);
    setEnrollDialogOpen(true);
  };

  const closeEnrollDialog = () => {
    setEnrollDialogOpen(false);
    setSelectedCourse(null);
  };

  const handleCreate = (data: CreateCourseSchemaType) => {
    createMutation.mutate(data, {
      onSuccess: () => closeDialog(),
    });
  };

  const handleUpdate = (data: UpdateCourseSchemaType) => {
    if (!selectedCourse) return;

    updateMutation.mutate(
      { id: selectedCourse.id, payload: data },
      { onSuccess: () => closeDialog() },
    );
  };

  const handleToggleStatus = (course: Course) => {
    const nextStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    statusMutation.mutate({ id: course.id, status: nextStatus });
  };

  const handleDelete = (course: Course) => {
    if (window.confirm(`Are you sure you want to permanently delete course ${course.courseName}?`)) {
      deleteMutation.mutate(course.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Academic Operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Course Management
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Configure course subjects, assign instructing faculty, deactivate or activate courses, and enroll students.
          </p>
        </div>
        <Button size="lg" className="gap-2 shrink-0" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden />
          Create course
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden />
              Total courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{total}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Matching current filters
            </p>
          </CardContent>
        </Card>
      </div>

      <CourseFiltersBar filters={filters} onChange={setFilters} />

      {coursesQuery.isError ? (
        <ErrorState
          message="Could not load courses. Please try again."
          onRetry={() => coursesQuery.refetch()}
        />
      ) : (
        <CourseTable
          courses={courses}
          isLoading={coursesQuery.isLoading}
          userRole={userRole}
          onEdit={openEditDialog}
          onToggleStatus={handleToggleStatus}
          onAssignStudents={userRole === "ADMIN" ? openEnrollDialog : undefined}
          onDelete={handleDelete}
          isStatusUpdating={statusMutation.isPending}
        />
      )}

      {meta && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} courses)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1 || coursesQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
              }
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages || coursesQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
              }
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <CourseFormDialog
        open={dialogOpen}
        mode={dialogMode}
        course={selectedCourse}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={closeDialog}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <EnrollmentDialog
        open={enrollDialogOpen}
        course={selectedCourse}
        onClose={closeEnrollDialog}
      />
    </div>
  );
}
