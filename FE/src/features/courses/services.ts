import apiClient from "@/lib/axios";
import { API_ENDPOINTS, QUERY_KEYS } from "@/shared/constants";
import type {
  Course,
  CourseListParams,
  CourseStatus,
  CreateCoursePayload,
  Enrollment,
  PaginatedCourses,
  UpdateCoursePayload,
} from "./types";

interface BackendListResult {
  data?: Course[];
  courses?: Course[];
  meta?: PaginatedCourses["meta"];
  pagination?: PaginatedCourses["meta"];
  result?: {
    data?: Course[];
    meta?: PaginatedCourses["meta"];
  };
}

interface BackendCourseResult {
  data?: Course;
  course?: Course;
  result?: {
    data?: Course;
    course?: Course;
  };
}

function normalizeListResponse(payload: BackendListResult): PaginatedCourses {
  const body = payload.result ?? payload;
  const data = body.data ?? payload.courses ?? [];
  const meta = body.meta ?? payload.meta ?? payload.pagination;

  if (!meta) {
    return {
      data,
      meta: {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  return { data, meta };
}

function normalizeCourseResponse(payload: BackendCourseResult): Course {
  const body = payload.result ?? payload;
  const course = body.data ?? body.course ?? payload.course ?? payload.data;

  if (!course) {
    throw new Error("Invalid course response from server");
  }

  return course;
}

function buildListQuery(params: CourseListParams) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.teacherId) query.set("teacherId", params.teacherId);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const courseService = {
  async list(params: CourseListParams = {}): Promise<PaginatedCourses> {
    const data = (await apiClient.get(
      `${API_ENDPOINTS.COURSES.LIST}${buildListQuery(params)}`,
    )) as BackendListResult;

    return normalizeListResponse(data);
  },

  async create(payload: CreateCoursePayload): Promise<Course> {
    const data = (await apiClient.post(
      API_ENDPOINTS.COURSES.CREATE,
      payload,
    )) as BackendCourseResult;

    return normalizeCourseResponse(data);
  },

  async update(id: string, payload: UpdateCoursePayload): Promise<Course> {
    const data = (await apiClient.put(
      API_ENDPOINTS.COURSES.UPDATE(id),
      payload,
    )) as BackendCourseResult;

    return normalizeCourseResponse(data);
  },

  async updateStatus(id: string, status: CourseStatus): Promise<Course> {
    const data = (await apiClient.patch(
      API_ENDPOINTS.COURSES.UPDATE_STATUS(id),
      { status },
    )) as BackendCourseResult;

    return normalizeCourseResponse(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.COURSES.DELETE(id));
  },

  async getEnrollments(courseId: string): Promise<Enrollment[]> {
    const data = (await apiClient.get(
      API_ENDPOINTS.COURSES.GET_ENROLLMENTS(courseId)
    )) as any;

    return (data.result?.data ?? data.data ?? data) as Enrollment[];
  },

  async getStudentEnrollments(studentEmail: string): Promise<Enrollment[]> {
    const data = (await apiClient.get(
      `/courses/student/enrollments?email=${encodeURIComponent(studentEmail)}`
    )) as any;

    return (data.result?.data ?? data.data ?? data) as Enrollment[];
  },

  async saveEnrollments(courseId: string, studentIds: string[]): Promise<Enrollment[]> {
    const data = (await apiClient.post(
      API_ENDPOINTS.COURSES.SAVE_ENROLLMENTS(courseId),
      { studentIds }
    )) as any;

    return (data.result?.data ?? data.data ?? data) as Enrollment[];
  },
};

export const courseQueryKeys = {
  all: QUERY_KEYS.COURSES,
  list: (params: CourseListParams) => [...QUERY_KEYS.COURSES, "list", params] as const,
  enrollments: (courseId: string) => [...QUERY_KEYS.COURSES, "enrollments", courseId] as const,
  studentEnrollments: (email: string) => [...QUERY_KEYS.COURSES, "student-enrollments", email] as const,
};
