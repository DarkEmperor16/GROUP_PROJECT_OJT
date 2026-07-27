export type CourseStatus = "ACTIVE" | "INACTIVE";

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description: string;
  teacherId: string;
  teacherName: string;
  status: CourseStatus;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  createdAt: string;
}

export interface CourseListParams {
  search?: string;
  teacherId?: string;
  status?: CourseStatus | "";
  page?: number;
  limit?: number;
}

export interface PaginatedCourses {
  data: Course[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCoursePayload {
  courseCode: string;
  courseName: string;
  description: string;
  teacherId: string;
  status: CourseStatus;
}

export type UpdateCoursePayload = CreateCoursePayload;
