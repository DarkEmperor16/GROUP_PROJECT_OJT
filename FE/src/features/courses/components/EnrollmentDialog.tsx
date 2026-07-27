import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useUsersQuery } from "@/features/users/hooks/useUsers";
import { useCourseEnrollmentsQuery, useSaveEnrollmentsMutation } from "../hooks/useCourses";
import type { Course } from "../types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface EnrollmentDialogProps {
  open: boolean;
  course: Course | null;
  onClose: () => void;
}

export default function EnrollmentDialog({
  open,
  course,
  onClose,
}: EnrollmentDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Query all students
  const studentsQuery = useUsersQuery({ role: "STUDENT", limit: 1000 });
  const students = studentsQuery.data?.data ?? [];

  // Query current enrollments for the course
  const enrollmentsQuery = useCourseEnrollmentsQuery(course?.id ?? "", open);
  const currentEnrollments = enrollmentsQuery.data ?? [];

  const saveMutation = useSaveEnrollmentsMutation();

  useEffect(() => {
    if (open && currentEnrollments.length > 0) {
      setSelectedIds(currentEnrollments.map((e) => e.studentId));
    } else if (open && enrollmentsQuery.isSuccess) {
      setSelectedIds([]);
    }
  }, [open, currentEnrollments, enrollmentsQuery.isSuccess]);

  if (!open || !course) return null;

  const handleToggle = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = () => {
    saveMutation.mutate(
      { courseId: course.id, studentIds: selectedIds },
      { onSuccess: () => onClose() }
    );
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.userCode.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = studentsQuery.isLoading || enrollmentsQuery.isLoading;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8 flex flex-col max-h-[90dvh]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Enrollments</p>
            <h2 id="enrollment-title" className="mt-1 text-2xl font-bold tracking-tight">
              Assign Students
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select students to enroll in <span className="font-semibold text-foreground">{course.courseName}</span> ({course.courseCode}).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search students by name, email, or code..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-border/60 rounded-xl bg-muted/20 p-2 space-y-1 min-h-[200px]">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No students match the search filters.
            </p>
          ) : (
            filteredStudents.map((student) => {
              const isChecked = selectedIds.includes(student.id);
              return (
                <label
                  key={student.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 cursor-pointer select-none transition-colors"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                    checked={isChecked}
                    onChange={() => handleToggle(student.id)}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {student.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.email} • <span className="font-mono">{student.userCode}</span>
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>{selectedIds.length} student(s) selected</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={saveMutation.isPending}
              onClick={handleSave}
            >
              Save enrollments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
