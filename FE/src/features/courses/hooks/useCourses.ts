import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { courseQueryKeys, courseService } from "../services";
import type {
  CourseListParams,
  CourseStatus,
  CreateCoursePayload,
  UpdateCoursePayload,
} from "../types";

export function useCoursesQuery(params: CourseListParams) {
  return useQuery({
    queryKey: courseQueryKeys.list(params),
    queryFn: () => courseService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCourseEnrollmentsQuery(courseId: string, enabled = true) {
  return useQuery({
    queryKey: courseQueryKeys.enrollments(courseId),
    queryFn: () => courseService.getEnrollments(courseId),
    enabled: enabled && !!courseId,
  });
}

export function useStudentEnrollmentsQuery(email: string, enabled = true) {
  return useQuery({
    queryKey: courseQueryKeys.studentEnrollments(email),
    queryFn: () => courseService.getStudentEnrollments(email),
    enabled: enabled && !!email,
  });
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => courseService.create(payload),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.all });
      toast.success("Course created", {
        description: `${course.courseName} (${course.courseCode}) has been successfully created.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to create course", {
        description: error.message || "Please check the form and try again.",
      });
    },
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCoursePayload;
    }) => courseService.update(id, payload),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.all });
      toast.success("Course updated", {
        description: `${course.courseName} has been successfully updated.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update course", {
        description: error.message || "Please check the form and try again.",
      });
    },
  });
}

export function useUpdateCourseStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      courseService.updateStatus(id, status),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.all });
      toast.success(
        course.status === "ACTIVE" ? "Course activated" : "Course deactivated",
        {
          description: `${course.courseName} is now ${course.status.toLowerCase()}.`,
        }
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", {
        description: error.message || "Please try again.",
      });
    },
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.all });
      toast.success("Course deleted", {
        description: "The course has been permanently removed.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete course", {
        description: error.message || "Please try again.",
      });
    },
  });
}

export function useSaveEnrollmentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      studentIds,
    }: {
      courseId: string;
      studentIds: string[];
    }) => courseService.saveEnrollments(courseId, studentIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: courseQueryKeys.enrollments(variables.courseId),
      });
      toast.success("Enrollments saved", {
        description: "Student enrollments have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to save enrollments", {
        description: error.message || "Please try again.",
      });
    },
  });
}
