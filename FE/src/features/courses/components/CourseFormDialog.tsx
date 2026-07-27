import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useUsersQuery } from "@/features/users/hooks/useUsers";
import {
  createCourseSchema,
  type CreateCourseSchemaType,
  type UpdateCourseSchemaType,
} from "../schema";
import type { Course } from "../types";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

const selectClassName =
  "h-12 w-full rounded-xl border border-input/80 bg-muted/40 px-4 text-sm shadow-sm transition-all duration-200 hover:border-input hover:bg-background focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10";

interface CourseFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  course?: Course | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onCreate: (data: CreateCourseSchemaType) => void;
  onUpdate: (data: UpdateCourseSchemaType) => void;
}

export default function CourseFormDialog({
  open,
  mode,
  course,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: CourseFormDialogProps) {
  const isEdit = mode === "edit";

  // Query teachers to select one
  const teachersQuery = useUsersQuery({ role: "TEACHER", limit: 1000 });
  const teachers = teachersQuery.data?.data ?? [];

  const form = useForm<CreateCourseSchemaType>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      description: "",
      teacherId: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit && course) {
      form.reset({
        courseCode: course.courseCode,
        courseName: course.courseName,
        description: course.description,
        teacherId: course.teacherId,
        status: course.status,
      });
    } else {
      form.reset({
        courseCode: "",
        courseName: "",
        description: "",
        teacherId: teachers[0]?.id ?? "",
        status: "ACTIVE",
      });
    }
  }, [open, isEdit, course, form, teachers]);

  if (!open) return null;

  const title = isEdit ? "Edit course" : "Create course";
  const description = isEdit
    ? "Update course details, code, description, and assign teacher."
    : "Provision a new course for instructors and student enrollment.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Course configuration</p>
            <h2 id="course-form-title" className="mt-1 text-2xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(isEdit ? onUpdate : onCreate)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course code</FormLabel>
                  <FormControl>
                    <Input placeholder="AV101" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course name</FormLabel>
                  <FormControl>
                    <Input placeholder="Aviation Meteorology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief course details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher in charge</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.fullName} ({teacher.email})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <option value="ACTIVE">Active — available for Q&A</option>
                      <option value="INACTIVE">Inactive — Q&A disabled</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
              >
                {isEdit ? "Save changes" : "Create course"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
